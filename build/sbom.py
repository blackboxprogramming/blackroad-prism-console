#!/usr/bin/env python3
"""Generate a simple SBOM from built wheels."""

from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
WHEELS = DIST / "wheels"
SBOM = DIST / "SBOM.spdx.json"


def _license_from_wheel(path: Path) -> str:
    with zipfile.ZipFile(path) as zf:
        for name in zf.namelist():
            if name.endswith("METADATA"):
                data = zf.read(name).decode()
                for line in data.splitlines():
                    if line.startswith("License:"):
                        return line.split(":", 1)[1].strip() or "UNKNOWN"
    return "UNKNOWN"


def main() -> None:
    packages = []
    for wheel in sorted(WHEELS.glob("*.whl")):
        sha = hashlib.sha256(wheel.read_bytes()).hexdigest()
        parts = wheel.name.split("-")
        if len(parts) < 2:
            continue
        name, version = parts[0], parts[1]
        packages.append({
            "name": name,
            "version": version,
            "sha256": sha,
            "license": _license_from_wheel(wheel),
        })
    DIST.mkdir(exist_ok=True)
    SBOM.write_text(json.dumps({"packages": packages}, indent=2))


if __name__ == "__main__":
    main()
