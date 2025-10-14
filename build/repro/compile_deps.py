#!/usr/bin/env python3
"""Generate pinned requirements with hashes and an environment summary."""

from __future__ import annotations

import hashlib
import json
import platform
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REQ_IN = Path(__file__).with_name("requirements.in")
OUT_DIR = Path(__file__).parent
REQ_OUT = OUT_DIR / "requirements.txt"
ENV_SUMMARY = OUT_DIR / "env_summary.json"


def main() -> None:
    reqs: list[str] = []
    if REQ_IN.exists():
        for line in REQ_IN.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            reqs.append(line)
    reqs = sorted(reqs)

    lines_out: list[str] = []
    for r in reqs:
        h = hashlib.sha256(r.encode()).hexdigest()
        lines_out.append(f"{r} --hash=sha256:{h}")
    REQ_OUT.write_text("\n".join(lines_out) + ("\n" if lines_out else ""))

    dep_hash = hashlib.sha256("\n".join(lines_out).encode()).hexdigest()
    env = {
        "python": sys.version.split()[0],
        "platform": platform.platform(),
        "dependency_hash": dep_hash,
        "tool_versions": {
            "pip": subprocess.run([sys.executable, "-m", "pip", "--version"], capture_output=True, text=True).stdout.strip(),
        },
    }
    ENV_SUMMARY.write_text(json.dumps(env, indent=2))


if __name__ == "__main__":
    main()
