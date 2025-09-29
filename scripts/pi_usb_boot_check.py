#!/usr/bin/env python3
"""Utility to verify Raspberry Pi USB boot media and enable high-current USB."""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import subprocess
import sys
from typing import Iterable, List, Optional

BOOT_LABEL_CANDIDATES = {"boot", "bootfs", "system-boot"}
ROOT_LABEL_CANDIDATES = {"root", "rootfs"}
BOOT_FSTYPE_CANDIDATES = {"vfat", "fat32", "fat"}
ROOT_FSTYPE_CANDIDATES = {"ext4", "ext3", "btrfs", "xfs"}


class CommandError(RuntimeError):
    """Raised when a required command fails."""


def _run(cmd: List[str]) -> str:
    """Run *cmd* and return stdout, raising CommandError on failure."""

    try:
        completed = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as exc:  # pragma: no cover - defensive
        raise CommandError(f"Command not found: {cmd[0]}") from exc
    except subprocess.CalledProcessError as exc:
        stdout = exc.stdout.strip() if exc.stdout else ""
        stderr = exc.stderr.strip() if exc.stderr else ""
        details = "\n".join(filter(None, [stdout, stderr]))
        message = f"Command {' '.join(cmd)!r} failed"
        if details:
            message = f"{message}:\n{details}"
        raise CommandError(message) from exc

    return completed.stdout


def _flatten_lsblk(tree: dict) -> Iterable[dict]:
    """Yield lsblk entries depth-first."""

    children = tree.get("children", []) or []
    for child in children:
        yield child
        yield from _flatten_lsblk(child)


def describe_partitions(device: str) -> List[dict]:
    """Return partition metadata for *device* using lsblk."""

    data = _run([
        "lsblk",
        "--json",
        "--paths",
        "--output",
        "NAME,LABEL,FSTYPE,TYPE,MOUNTPOINT",
        device,
    ])
    parsed = json.loads(data)
    blockdevices = parsed.get("blockdevices", [])
    partitions: List[dict] = []
    for block in blockdevices:
        for entry in _flatten_lsblk(block):
            if entry.get("type") == "part":
                partitions.append(entry)
    return partitions


def _normalize(value: Optional[str]) -> str:
    return (value or "").strip().lower()


def _match_partition(entry: dict, label_candidates: set[str], fstype_candidates: set[str]) -> bool:
    label = _normalize(entry.get("label"))
    fstype = _normalize(entry.get("fstype"))
    if label and label in label_candidates:
        return True
    if fstype and fstype in fstype_candidates:
        return True
    return False


def check_boot_media(device: str) -> tuple[Optional[dict], Optional[dict]]:
    """Check that *device* has boot and root partitions.

    Returns a tuple of the boot partition entry and the root partition entry.
    """

    partitions = describe_partitions(device)
    boot_part = None
    root_part = None
    for entry in partitions:
        if boot_part is None and _match_partition(entry, BOOT_LABEL_CANDIDATES, BOOT_FSTYPE_CANDIDATES):
            boot_part = entry
        if root_part is None and _match_partition(entry, ROOT_LABEL_CANDIDATES, ROOT_FSTYPE_CANDIDATES):
            root_part = entry
    return boot_part, root_part


def ensure_usb_current(config_path: pathlib.Path, dry_run: bool = False) -> bool:
    """Ensure usb_max_current_enable=1 is set in config.txt.

    Returns True if a modification would be (or was) made.
    """

    if not config_path.exists():
        raise FileNotFoundError(f"config.txt not found at {config_path}")

    original = config_path.read_text().splitlines()
    updated = list(original)
    modified = False
    pattern = re.compile(r"^\s*#?\s*usb_max_current_enable\s*=\s*(\d+).*$", re.IGNORECASE)

    for idx, line in enumerate(updated):
        match = pattern.match(line)
        if not match:
            continue
        value = match.group(1)
        if value != "1" or line.lstrip().startswith("#"):
            updated[idx] = "usb_max_current_enable=1"
            modified = True
        break
    else:
        updated.append("usb_max_current_enable=1")
        modified = True

    if modified and not dry_run:
        config_path.write_text("\n".join(updated) + "\n")
    return modified


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Verify Raspberry Pi USB boot media contents and enable high-current USB mode.",
    )
    parser.add_argument(
        "device",
        help="Block device path (e.g. /dev/sda) to inspect.",
    )
    parser.add_argument(
        "--boot-mount",
        dest="boot_mount",
        help="Path where the boot partition is mounted (used to patch config.txt).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report actions without modifying files.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_args(argv)
    device = args.device
    boot_part, root_part = check_boot_media(device)

    if boot_part:
        print(f"✔ Boot partition detected: {boot_part['name']} (label={boot_part.get('label')!r}, fstype={boot_part.get('fstype')!r})")
    else:
        print("✘ No boot partition detected (expected label bootfs/boot or FAT filesystem).")

    if root_part:
        print(f"✔ Root partition detected: {root_part['name']} (label={root_part.get('label')!r}, fstype={root_part.get('fstype')!r})")
    else:
        print("✘ No root partition detected (expected label rootfs/root or Linux filesystem).")

    status = 0
    if not boot_part or not root_part:
        status = 1

    if args.boot_mount:
        config_path = pathlib.Path(args.boot_mount) / "config.txt"
        try:
            modified = ensure_usb_current(config_path, dry_run=args.dry_run)
        except FileNotFoundError as exc:
            print(f"✘ {exc}")
            status = 1
        else:
            if modified:
                action = "Would update" if args.dry_run else "Updated"
                print(f"✔ {action} {config_path} with usb_max_current_enable=1")
            else:
                print(f"✔ {config_path} already sets usb_max_current_enable=1")

    return status


if __name__ == "__main__":
    try:
        sys.exit(main())
    except CommandError as err:
        print(f"✘ {err}")
        sys.exit(2)
