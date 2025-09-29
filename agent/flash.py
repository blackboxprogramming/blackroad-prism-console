"""Utilities for imaging removable devices from the Pi dashboard."""

from __future__ import annotations

import json
import os
import shlex
import subprocess
from typing import Dict, Generator, List


TMP_IMAGE_PATH = "/tmp/blackroad.img.xz"


def _sh(cmd: str) -> tuple[int, str]:
    """Run *cmd* in a shell and return ``(returncode, output)``."""

    try:
        out = subprocess.check_output(shlex.split(cmd), text=True, stderr=subprocess.STDOUT)
        return 0, out
    except subprocess.CalledProcessError as exc:  # pragma: no cover - passthrough
        return exc.returncode, exc.output


def _root_disk(path: str) -> str:
    """Strip partition suffixes from a block-device path."""

    device = path.strip()
    while device and device[-1].isdigit():
        device = device[:-1]
    if device.endswith("p"):
        device = device[:-1]
    return device


def _partition_path(device: str, part: int) -> str:
    """Return the path for ``part`` on ``device`` (handles mmc/nvme suffixes)."""

    suffix = f"p{part}" if device and device[-1].isdigit() else str(part)
    return f"{device}{suffix}"


def list_devices() -> List[Dict[str, str]] | Dict[str, str]:
    """Return removable, non-root block devices."""

    try:
        root = subprocess.check_output("findmnt -no SOURCE /", shell=True, text=True).strip()
    except subprocess.CalledProcessError as exc:
        return {"error": exc.output.strip() if exc.output else str(exc)}

    rootdisk = _root_disk(root)
    rc, out = _sh("lsblk -J -o NAME,SIZE,TYPE,MOUNTPOINT,RM,ROTA,MODEL,TRAN")
    if rc:
        return {"error": out.strip()}

    info = json.loads(out)
    devices: List[Dict[str, str]] = []

    def walk(node: Dict[str, str]) -> None:
        name = "/dev/" + node["name"]
        if node.get("type") == "disk":
            if name.startswith(rootdisk):
                return
            devices.append(
                {
                    "device": name,
                    "size": node.get("size", ""),
                    "model": node.get("model", ""),
                    "rm": node.get("rm", 0),
                    "tran": node.get("tran", ""),
                }
            )
        for child in (node.get("children") or []):
            walk(child)

    for node in info.get("blockdevices", []) or []:
        walk(node)

    return devices


def flash(image_url: str, device: str, safe_hdmi: bool = True, enable_ssh: bool = True) -> Generator[str, None, None]:
    """Stream progress while flashing *image_url* to *device*."""

    try:
        root = subprocess.check_output("findmnt -no SOURCE /", shell=True, text=True).strip()
    except subprocess.CalledProcessError as exc:
        yield f"ERROR: unable to determine root disk: {exc.output.strip() if exc.output else exc}"
        return

    rootdisk = _root_disk(root)
    if device.startswith(rootdisk):
        yield "ERROR: Refusing to flash the system disk."
        return

    download_cmd = f"curl -L {shlex.quote(image_url)} -o {shlex.quote(TMP_IMAGE_PATH)}"
    write_cmd = (
        f"xzcat {shlex.quote(TMP_IMAGE_PATH)} | "
        f"sudo dd of={shlex.quote(device)} bs=8M status=progress conv=fsync"
    )

    try:
        proc = subprocess.Popen(  # noqa: S603  # shell needed for pipeline streaming
            f"{download_cmd} && {write_cmd}",
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
    except OSError as exc:  # pragma: no cover - system-specific failure
        yield f"ERROR: failed to start writer: {exc}"
        return

    try:
        if proc.stdout is not None:
            for line in proc.stdout:
                yield line.rstrip("\n")
        proc.wait()

        if proc.returncode != 0:
            yield f"ERROR: writer exited {proc.returncode}"
            return

        for cmd in ("sync", f"sudo partprobe {shlex.quote(device)}"):
            rc, out = _sh(cmd)
            if rc:
                yield f"ERROR: command failed ({cmd}): {out.strip()}"
                return

        bootpart = _partition_path(device, 1)
        try:
            subprocess.run(["sudo", "mount", bootpart, "/mnt"], check=True)
        except subprocess.CalledProcessError as exc:
            yield f"ERROR: failed to mount {bootpart}: {exc}"
            return

        try:
            with open("/mnt/config.txt", "a", encoding="utf-8") as cfg:
                cfg.write("\nusb_max_current_enable=1\n")
                if safe_hdmi:
                    cfg.write("hdmi_safe=1\nhdmi_force_hotplug=1\n")
            if enable_ssh:
                open("/mnt/ssh", "w", encoding="utf-8").close()
        except OSError as exc:
            yield f"ERROR: failed to update boot partition: {exc}"
        finally:
            subprocess.run(["sudo", "umount", "/mnt"], check=False)

        yield "[BLACKROAD_FLASH_DONE]"
    finally:
        try:
            if os.path.exists(TMP_IMAGE_PATH):
                os.remove(TMP_IMAGE_PATH)
        except OSError:
            pass
