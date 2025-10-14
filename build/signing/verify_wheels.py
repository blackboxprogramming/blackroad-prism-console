#!/usr/bin/env python3
"""Verify wheel signatures and checksums."""

from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GNUPG = Path(__file__).with_name("gnupg")
WHEEL_DIR = ROOT / "dist" / "wheels"


def main() -> None:
    sha_file = WHEEL_DIR / "SHA256SUMS"
    subprocess.check_call([
        "gpg",
        "--batch",
        "--verify",
        str(sha_file) + ".asc",
        str(sha_file),
    ], env={"GNUPGHOME": str(GNUPG)})
    lines = sha_file.read_text().splitlines()
    for line in lines:
        digest, name = line.split()
        wheel_path = WHEEL_DIR / name
        actual = hashlib.sha256(wheel_path.read_bytes()).hexdigest()
        if actual != digest:
            raise SystemExit(f"hash mismatch for {name}")
        subprocess.check_call([
            "gpg",
            "--batch",
            "--verify",
            str(wheel_path) + ".asc",
            str(wheel_path),
        ], env={"GNUPGHOME": str(GNUPG)})


if __name__ == "__main__":
    main()
