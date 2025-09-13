#!/usr/bin/env python3
"""Generate license table from SBOM and enforce policy."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SBOM = ROOT / "dist" / "SBOM.spdx.json"
OUT = ROOT / "dist" / "LICENSES.md"
POLICY = ROOT / "config" / "license_policy.yaml"


def _load_policy() -> dict[str, list[str]]:
    policy: dict[str, list[str]] = {"allowed": [], "disallowed": []}
    current: str | None = None
    for line in POLICY.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.endswith(":"):
            current = line[:-1]
            policy[current] = []
        elif line.startswith("-") and current:
            policy[current].append(line[1:].strip())
    return policy


def main() -> None:
    data = json.loads(SBOM.read_text())
    policy = _load_policy()
    lines = ["| Package | License |", "|---|---|"]
    violations: list[str] = []
    for pkg in data.get("packages", []):
        lic = pkg.get("license", "UNKNOWN")
        lines.append(f"| {pkg['name']} | {lic} |")
        if lic in policy.get("disallowed", []):
            violations.append(pkg["name"])
    OUT.write_text("\n".join(lines) + "\n")
    if violations:
        raise SystemExit("Disallowed licenses: " + ", ".join(violations))


if __name__ == "__main__":
    main()
