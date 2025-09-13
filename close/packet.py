from __future__ import annotations

import json
from pathlib import Path
from typing import List
from tools import storage, artifacts, metrics
from . import sox

ARTIFACTS_ROOT = Path("artifacts/close")


def build_packet(period: str) -> Path:
    # gate checks
    sox.check_evidence(period)
    recon_path = ARTIFACTS_ROOT / period / "recons" / "recons.json"
    recons = json.loads(storage.read(str(recon_path))) if recon_path.exists() else []
    if any(r["status"] == "investigate" for r in recons):
        raise ValueError("RECON_OPEN")
    packet_dir = ARTIFACTS_ROOT / period / "packet"
    # index
    artifacts.validate_and_write(str(packet_dir / "index.md"), f"Close packet for {period}")
    # copy adjusted tb
    tb_json = json.loads(storage.read(str(ARTIFACTS_ROOT / period / "adjusted_tb.json")))
    artifacts.validate_and_write(str(packet_dir / "adjusted_tb.json"), tb_json, "contracts/schemas/trial_balance.json")
    # flux
    flux_md_path = ARTIFACTS_ROOT / period / "flux" / "flux.md"
    artifacts.validate_and_write(str(packet_dir / "flux.md"), storage.read(str(flux_md_path)))
    # recons
    recon_md = "\n".join(f"{r['account']}: {r['status']}" for r in recons)
    artifacts.validate_and_write(str(packet_dir / "recons.md"), recon_md)
    # controls
    ctrl_lines = "\n".join(sox.check_evidence(period))
    artifacts.validate_and_write(str(packet_dir / "controls.md"), ctrl_lines)
    metrics.emit("close_packet_built")
    return packet_dir


def sign(period: str, role: str, user: str) -> None:
    packet_dir = ARTIFACTS_ROOT / period / "packet"
    build_packet(period)  # ensure packet & gates
    record = {"role": role, "user": user}
    artifacts.validate_and_write(str(packet_dir / f"sign_{role}.json"), record)
    metrics.emit("close_signoff")
