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
from dataclasses import dataclass
from pathlib import Path
from typing import List

ARTIFACTS_ROOT = Path("artifacts/close")


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
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "control_id": self.control_id,
            "period": self.period,
            "path": self.path,
            "owner": self.owner,
            "checksum": self.checksum,
            "signed": self.signed,
        }


def _evidence_file(period: str) -> Path:
    base = ARTIFACTS_ROOT / period
    base.mkdir(parents=True, exist_ok=True)
    return base / "sox_evidence.jsonl"


def add(period: str, control_id: str, path: str, owner: str) -> Evidence:
    file_path = Path(path)
    checksum = hashlib.sha256(file_path.read_bytes()).hexdigest()
    evid = Evidence(
        id=checksum[:8],
        control_id=control_id,
        period=period,
        path=str(file_path),
        owner=owner,
        checksum=checksum,
    )
    ev_file = _evidence_file(period)
    with ev_file.open("a") as f:
        f.write(json.dumps(evid.to_dict()) + "\n")
    return evid


def list_evidence(period: str) -> List[Evidence]:
    ev_file = _evidence_file(period)
    if not ev_file.exists():
        return []
    evidences = []
    for line in ev_file.read_text().splitlines():
        evidences.append(Evidence(**json.loads(line)))
    return evidences


def check(period: str, required: List[str]) -> List[str]:
    present = {e.control_id for e in list_evidence(period)}
    return [cid for cid in required if cid not in present]
