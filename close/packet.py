from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

from .sox import check as sox_check

ARTIFACTS_ROOT = Path("artifacts/close")


def build_packet(period: str) -> Path:
    base = ARTIFACTS_ROOT / period
    packet_dir = base / "packet"
    packet_dir.mkdir(parents=True, exist_ok=True)
    # copy references by writing index
    index_lines = [
        f"adjusted_tb: {base / 'adjusted_tb.csv'}",
        f"flux: {base / 'flux/flux.md'}",
        f"recons: {base / 'recons/index.md'}",
    ]
    (packet_dir / "index.md").write_text("\n".join(index_lines) + "\n")
    return packet_dir


def sign(period: str, role: str, user: str) -> Path:
    base = ARTIFACTS_ROOT / period
    recons = json.loads((base / "recons" / "recons.json").read_text()) if (base / "recons" / "recons.json").exists() else []
    if any(r.get("status") != "match" for r in recons):
        raise ValueError("RECON_OPEN")
    missing = sox_check(period, [])  # no required controls supplied
    if missing:
        raise ValueError("SOX_EVIDENCE_MISSING")
    sign_path = base / "packet" / "signoffs.json"
    data = {}
    if sign_path.exists():
        data = json.loads(sign_path.read_text())
    data[role] = user
    sign_path.write_text(json.dumps(data, indent=2))
    return sign_path
