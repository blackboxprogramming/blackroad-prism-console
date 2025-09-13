#!/usr/bin/env python3
"""Build wheels for the project and its dependencies into dist/wheels."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WHEEL_DIR = ROOT / "dist" / "wheels"
REQ_FILE = ROOT / "build" / "repro" / "requirements.txt"


def main() -> None:
    WHEEL_DIR.mkdir(parents=True, exist_ok=True)
    pkgs: list[str] = []
    if REQ_FILE.exists():
        for line in REQ_FILE.read_text().splitlines():
            line = line.strip()
            if not line:
                continue
            pkgs.append(line.split()[0])
    if pkgs:
        subprocess.check_call([sys.executable, "-m", "pip", "wheel", "--no-deps", "--wheel-dir", str(WHEEL_DIR)] + pkgs)
    subprocess.check_call([sys.executable, "-m", "pip", "wheel", "--no-deps", "--wheel-dir", str(WHEEL_DIR), str(ROOT)])
    links = "\n".join(f'<a href="{p.name}">{p.name}</a>' for p in sorted(WHEEL_DIR.glob("*.whl")))
    (WHEEL_DIR / "index.html").write_text(f"<html><body>{links}</body></html>")


if __name__ == "__main__":
    main()
