from __future__ import annotations

import json
from pathlib import Path
from typing import List, Sequence

import yaml

from .sox import check as sox_check

ARTIFACTS_ROOT = Path("artifacts/close")
DEFAULT_SOX_CONTROLS = Path("configs/close/sox_controls.yaml")


def _load_required_controls(config_path: Path) -> List[str]:
    if not config_path.exists():
        raise FileNotFoundError(f"Missing SOX controls configuration at {config_path}")
    data = yaml.safe_load(config_path.read_text()) or {}
    controls = data.get("controls", {})
    required: List[str] = []
    for entries in controls.values():
        if not entries:
            continue
        required.extend(entries)
    # remove duplicates while preserving order of first occurrence
    seen = set()
    return [cid for cid in required if not (cid in seen or seen.add(cid))]


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


def sign(
    period: str,
    role: str,
    user: str,
    required_controls: Sequence[str] | None = None,
    controls_config: Path | None = None,
) -> Path:
    base = ARTIFACTS_ROOT / period
    recons = json.loads((base / "recons" / "recons.json").read_text()) if (base / "recons" / "recons.json").exists() else []
    if any(r.get("status") != "match" for r in recons):
        raise ValueError("RECON_OPEN")
    if required_controls is None:
        config_path = controls_config or DEFAULT_SOX_CONTROLS
        required_controls = _load_required_controls(config_path)
    missing = sox_check(period, list(required_controls))
    if missing:
        raise ValueError("SOX_EVIDENCE_MISSING")
    sign_path = base / "packet" / "signoffs.json"
    data = {}
    if sign_path.exists():
        data = json.loads(sign_path.read_text())
    data[role] = user
    sign_path.write_text(json.dumps(data, indent=2))
    return sign_path
