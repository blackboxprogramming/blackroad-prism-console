#!/usr/bin/env python3
"""Sign wheels and create checksum files."""

from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GNUPG = Path(__file__).with_name("gnupg")
WHEEL_DIR = ROOT / "dist" / "wheels"


def main() -> None:
    sha_lines: list[str] = []
    for wheel in sorted(WHEEL_DIR.glob("*.whl")):
        digest = hashlib.sha256(wheel.read_bytes()).hexdigest()
        sha_lines.append(f"{digest}  {wheel.name}")
        subprocess.check_call([
            "gpg",
            "--batch",
            "--yes",
            "--detach-sign",
            "--armor",
            str(wheel),
        ], env={"GNUPGHOME": str(GNUPG)})
    sha_file = WHEEL_DIR / "SHA256SUMS"
    sha_file.write_text("\n".join(sha_lines) + "\n")
    subprocess.check_call([
        "gpg",
        "--batch",
        "--yes",
        "--detach-sign",
        "--armor",
        str(sha_file),
    ], env={"GNUPGHOME": str(GNUPG)})


if __name__ == "__main__":
    main()
