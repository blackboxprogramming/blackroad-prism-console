"""Utilities for listing block devices and flashing disk images."""
from __future__ import annotations

import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Iterator, List, Optional, Tuple

LSBLK_FIELDS = ["NAME", "KNAME", "TYPE", "SIZE", "MODEL", "TRAN"]


def _run(command: List[str]) -> subprocess.CompletedProcess:
    """Run a command and return the completed process."""
    return subprocess.run(command, check=True, capture_output=True, text=True)


def list_devices() -> List[Dict[str, str]]:
    """Return block devices detected via lsblk."""
    try:
        result = _run(["lsblk", "-J", "-o", ",".join(LSBLK_FIELDS)])
    except (FileNotFoundError, subprocess.CalledProcessError):
        return []

    info = json.loads(result.stdout or "{}")
    devices: List[Dict[str, str]] = []
    for block in info.get("blockdevices", []):
        if block.get("type") != "disk":
            continue
        devices.append(
            {
                "device": f"/dev/{block.get('kname', block.get('name', ''))}",
                "name": block.get("name", ""),
                "size": block.get("size", ""),
                "model": block.get("model", ""),
                "transport": block.get("tran", ""),
            }
        )
    return devices


def _download(url: str, out: str) -> str:
    """Download a file to the specified output path."""
    import urllib.request

    urllib.request.urlretrieve(url, out)
    return out


def verify_sha256(file_path: str, sha256_url: str) -> Tuple[bool, str]:
    """Fetch the expected SHA256 checksum and compare it with the local file."""
    import hashlib
    import urllib.request

    try:
        expected = (
            urllib.request.urlopen(sha256_url)
            .read()
            .decode()
            .split()[0]
            .strip()
        )
    except Exception as exc:  # noqa: BLE001 - propagate message via return value
        return False, f"error: {exc}"

    hasher = hashlib.sha256()
    with open(file_path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            hasher.update(chunk)
    return hasher.hexdigest() == expected, expected


def flash(device: str, image_url: str, sha256_url: Optional[str] = None) -> Iterator[str]:
    """Flash an xz-compressed image to the specified block device."""
    tmp_dir = tempfile.gettempdir()
    xz_path = str(Path(tmp_dir) / "blackroad.img.xz")

    yield f"Downloading image: {image_url}"
    try:
        _download(image_url, xz_path)
    except Exception as exc:  # noqa: BLE001
        yield f"ERROR: download failed ({exc})"
        return

    yield f"Downloaded to {xz_path}"

    sha_source = sha256_url or os.environ.get("BLACKROAD_SHA256_URL", "").strip()
    if sha_source:
        ok, expected = verify_sha256(xz_path, sha_source)
        if ok:
            yield f"SHA256 OK: {expected}"
        else:
            yield f"WARNING: SHA256 mismatch or unavailable ({expected})"

    dd_cmd = ["dd", f"of={device}", "bs=4M", "conv=fsync", "status=progress"]
    if os.geteuid() != 0:
        dd_cmd.insert(0, "sudo")

    yield "Writing image to device..."

    try:
        with subprocess.Popen(  # noqa: P201
            ["xzcat", xz_path], stdout=subprocess.PIPE, stderr=subprocess.STDOUT
        ) as xz_proc:
            assert xz_proc.stdout is not None
            with subprocess.Popen(
                dd_cmd,
                stdin=xz_proc.stdout,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            ) as dd_proc:
                xz_proc.stdout.close()
                assert dd_proc.stdout is not None
                for line in dd_proc.stdout:
                    yield line.strip()
                dd_return = dd_proc.wait()
            xz_return = xz_proc.wait()
    except FileNotFoundError as exc:
        yield f"ERROR: required command missing ({exc})"
        return

    if dd_return != 0 or xz_return != 0:
        yield f"ERROR: flashing failed (xz exit {xz_return}, dd exit {dd_return})"
        return

    yield "Syncing writes..."
    try:
        subprocess.run(["sync"], check=True)
    except subprocess.CalledProcessError:
        yield "WARNING: sync command reported an error"

    try:
        Path(xz_path).unlink()
    except OSError:
        pass

    yield "Flash complete"
