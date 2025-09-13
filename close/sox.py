from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List
import yaml
from tools import storage, artifacts, metrics

ARTIFACTS_ROOT = Path("artifacts/close")
REG_PATH = "sox_evidence.jsonl"
SCHEMA = "contracts/schemas/sox_evidence.json"
CTRL_CONFIG = Path("configs/close/sox_controls.yaml")


@dataclass
class Evidence:
    id: str
    control_id: str
    period: str
    path: str
    owner: str
    checksum: str
    signed: bool = False


def _registry_path(period: str) -> Path:
    return ARTIFACTS_ROOT / period / REG_PATH


def add_evidence(period: str, control_id: str, path: str, owner: str) -> Evidence:
    data = storage.read(path)
    checksum = hashlib.sha256(data.encode("utf-8")).hexdigest()
    evid = Evidence(id=control_id, control_id=control_id, period=period, path=path, owner=owner, checksum=checksum)
    artifacts.validate_and_write(str(_registry_path(period)), asdict(evid), SCHEMA)
    metrics.emit("sox_evidence_logged")
    return evid


def check_evidence(period: str) -> List[str]:
    reg_path = _registry_path(period)
    lines = storage.read(str(reg_path)).splitlines() if reg_path.exists() else []
    records = [json.loads(l) for l in lines if l.strip()]
    present = {r["control_id"] for r in records}
    cfg = yaml.safe_load(storage.read(str(CTRL_CONFIG))) or {}
    required = set()
    for ctrls in cfg.values():
        required.update(ctrls.get("controls", []))
    missing = sorted(required - present)
    if missing:
        raise ValueError("SOX_EVIDENCE_MISSING: " + ",".join(missing))
    return sorted(present)
