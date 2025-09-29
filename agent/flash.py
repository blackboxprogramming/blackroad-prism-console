"""Storage flashing helpers for the BlackRoad Pi dashboard."""
from __future__ import annotations

import json
import os
import shlex
import subprocess
from pathlib import Path
from typing import Iterable, Optional

__all__ = ["list_devices", "flash"]

_IMAGE_PATH = Path("/tmp/blackroad.img.xz")
_MOUNT_POINT = Path("/mnt")


def _sh(cmd: str) -> tuple[int, str]:
    """Execute *cmd* returning ``(returncode, stdout)``.

    The command is executed using ``shell=False`` with ``shlex.split`` to
    avoid surprises with shell interpretation.  Stderr is redirected to
    stdout so callers receive a combined stream.
    """

    try:
        out = subprocess.check_output(
            shlex.split(cmd), text=True, stderr=subprocess.STDOUT
        )
        return 0, out
    except subprocess.CalledProcessError as exc:  # pragma: no cover - depends on system
        return exc.returncode, exc.output


def _root_disk() -> Optional[str]:
    """Return the absolute path of the block device that backs ``/``.

    On typical installations ``findmnt -no SOURCE /`` returns a partition
    such as ``/dev/sda1`` or ``/dev/mmcblk0p2``.  We resolve that to the
    parent disk so we can exclude it from flashing targets.
    """

    try:
        root = subprocess.check_output(
            ["findmnt", "-no", "SOURCE", "/"], text=True
        ).strip()
    except subprocess.CalledProcessError:  # pragma: no cover - depends on system
        return None

    if not root:
        return None

    rc, parent = _sh(f"lsblk -no pkname {shlex.quote(root)}")
    if rc == 0 and parent.strip():
        return f"/dev/{parent.strip()}"

    # Fallback: trim trailing digits (partitions) and optional 'p'
    disk = root.rstrip("0123456789")
    if disk.endswith("p"):
        disk = disk[:-1]
    return disk or root


def _normalise_device(device: str) -> str:
    """Return ``device`` with symlinks resolved and without surrounding whitespace."""

    resolved = os.path.realpath(device.strip())
    return resolved


def _is_system_disk(device: str, rootdisk: Optional[str]) -> bool:
    if not rootdisk:
        return False
    dev = _normalise_device(device)
    rd = _normalise_device(rootdisk)
    return dev == rd or dev.startswith(f"{rd}")


def list_devices() -> list[dict[str, object]] | dict[str, str]:
    """Return metadata for removable, non-root block devices.

    The structure mirrors the ``lsblk`` JSON schema so the dashboard can
    display size/model/transport details.  On error a dict with an
    ``"error"`` key is returned.
    """

    rootdisk = _root_disk()
    rc, out = _sh("lsblk -J -o NAME,SIZE,TYPE,MOUNTPOINT,RM,ROTA,MODEL,TRAN")
    if rc != 0:
        return {"error": out.strip() or "lsblk failed"}

    try:
        info = json.loads(out)
    except json.JSONDecodeError as exc:  # pragma: no cover - depends on system
        return {"error": f"Failed to parse lsblk output: {exc}"}

    devices: list[dict[str, object]] = []

    def walk(node: dict[str, object]) -> None:
        name = f"/dev/{node['name']}"
        if node.get("type") == "disk":
            if _is_system_disk(name, rootdisk):
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
        for child in node.get("children") or []:
            walk(child)

    for node in info.get("blockdevices", []) or []:
        walk(node)

    return devices


def _partition_name(device: str, index: int = 1) -> str:
    """Return the partition path for ``device`` (handles ``sdX`` vs ``nvme``/``mmc``)."""

    suffix = f"p{index}" if device[-1].isdigit() else f"{index}"
    return f"{device}{suffix}"


def _cleanup_image() -> None:
    try:
        _IMAGE_PATH.unlink()
    except FileNotFoundError:
        pass


def _write_file(path: Path, contents: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(contents)


def flash(
    image_url: str,
    device: str,
    *,
    safe_hdmi: bool = True,
    enable_ssh: bool = True,
) -> Iterable[str]:
    """Flash ``image_url`` to ``device`` yielding progress messages.

    This generator streams human-readable status strings suitable for
    forwarding over a WebSocket.  The calling code is expected to handle
    cancellation by simply stopping iteration.
    """

    if not image_url:
        yield "ERROR: image_url is required"
        return

    if not device.startswith("/dev/"):
        yield "ERROR: device path must start with /dev/"
        return

    rootdisk = _root_disk()
    if _is_system_disk(device, rootdisk):
        yield "ERROR: Refusing to flash the system disk."
        return

    if not Path(device).exists():
        yield f"ERROR: Device {device} not found"
        return

    _cleanup_image()
    download_cmd = f"curl -L {shlex.quote(image_url)} -o {_IMAGE_PATH}"
    yield f"Downloading image from {image_url}"
    rc, out = _sh(download_cmd)
    if rc != 0:
        _cleanup_image()
        yield f"ERROR: download failed ({rc})\n{out.strip()}"
        return

    write_cmd = (
        f"xzcat {_IMAGE_PATH} | sudo dd of={shlex.quote(device)} bs=8M "
        "status=progress conv=fsync"
    )
    yield "Writing image to device"
    proc = subprocess.Popen(  # noqa: S603 - command constructed above
        write_cmd,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    try:
        assert proc.stdout is not None  # for type checkers
        for line in proc.stdout:
            yield line.rstrip("\n")
    finally:
        proc.wait()

    if proc.returncode != 0:
        _cleanup_image()
        yield f"ERROR: writer exited {proc.returncode}"
        return

    yield "Syncing data"
    subprocess.run(["sync"], check=False)
    subprocess.run(["sudo", "partprobe", device], check=False)

    boot_part = _partition_name(device, 1)
    mount_args = ["sudo", "mount", boot_part, str(_MOUNT_POINT)]
    yield f"Mounting boot partition {boot_part}"
    try:
        subprocess.run(
            mount_args,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as exc:
        _cleanup_image()
        stderr = exc.stderr.decode().strip() if exc.stderr else str(exc)
        yield f"ERROR: Failed to mount {boot_part}: {stderr}"
        return

    try:
        config_path = _MOUNT_POINT / "config.txt"
        if config_path.exists():
            additions = ["", "usb_max_current_enable=1"]
            if safe_hdmi:
                additions.append("hdmi_safe=1")
                additions.append("hdmi_force_hotplug=1")
            _write_file(config_path, "\n".join(additions) + "\n")
        else:
            yield "WARNING: config.txt not found; skipping HDMI tweaks"

        if enable_ssh:
            ssh_flag = _MOUNT_POINT / "ssh"
            ssh_flag.touch(exist_ok=True)
    finally:
        subprocess.run(["sudo", "umount", str(_MOUNT_POINT)], check=False)
        _cleanup_image()

    yield "[BLACKROAD_FLASH_DONE]"
