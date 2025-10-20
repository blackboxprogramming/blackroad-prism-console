from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

from tools import artifacts, storage

ROOT = Path(__file__).resolve().parents[0].parents[0]
ARTIFACTS = ROOT / "artifacts" / "mdm"


@dataclass
class Change:
    id: str
    domain: str
    type: str
    payload: Dict[str, Any]
    reason: str | None = None
    status: str = "draft"

    def to_json(self) -> Dict[str, Any]:
        return self.__dict__


def _next_id() -> str:
    counter_path = ARTIFACTS / "changes" / "counter.txt"
    cnt = int(storage.read(str(counter_path)) or 0) + 1
    artifacts.validate_and_write(str(counter_path), str(cnt), None)
    return f"CHG-{cnt:03d}"


def new(domain: str, type: str, payload_file: Path, reason: str | None = None) -> Change:
    payload = json.loads(storage.read(str(payload_file))) if payload_file.exists() else {}
    chg = Change(id=_next_id(), domain=domain, type=type, payload=payload, reason=reason)
    out = ARTIFACTS / "changes" / f"{chg.id}.json"
    artifacts.validate_and_write(str(out), chg.to_json(), None)
    return chg


def approve(id: str, as_user: str) -> Change:
    path = ARTIFACTS / "changes" / f"{id}.json"
    data = json.loads(storage.read(str(path)))
    data["status"] = "approved"
    artifacts.validate_and_write(str(path), data, None)
    return Change(**data)


def _dq_clean(domain: str) -> bool:
    dq_dir = ARTIFACTS / "dq"
    files = sorted(dq_dir.glob(f"{domain}_*.json"))
    if not files:
        return True
    data = json.loads(files[-1].read_text())
    for check in data.get("checks", []):
        if check["violations"]:
            return False
    return True


def apply(id: str) -> Change:
    path = ARTIFACTS / "changes" / f"{id}.json"
    data = json.loads(storage.read(str(path)))
    if data.get("status") != "approved":
        raise ValueError("not approved")
    if not _dq_clean(data["domain"]):
        raise ValueError("MDM_DQ_BLOCK")
    data["status"] = "applied"
    artifacts.validate_and_write(str(path), data, None)
    return Change(**data)

