from __future__ import annotations
import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from tools import storage
from .kpi_sot import REGISTRY, IR_ARTIFACTS
from .utils import log_metric


def _signoff_path() -> Path:
    return IR_ARTIFACTS / "signoff.jsonl"


def request_signoff(kpi_id: str, period: str) -> dict:
    if kpi_id not in REGISTRY:
        raise KeyError(kpi_id)
    entry = {"kpi": kpi_id, "period": period, "action": "request", "ts": datetime.utcnow().isoformat()}
    storage.write(str(_signoff_path()), entry)
    log_metric("ir_signoff_req")
    return entry


def approve(kpi_id: str, period: str, user: str) -> dict:
    entry = {"kpi": kpi_id, "period": period, "action": "approve", "user": user, "ts": datetime.utcnow().isoformat()}
    storage.write(str(_signoff_path()), entry)
    log_metric("ir_signoff_approve")
    return entry


def reject(kpi_id: str, period: str, user: str) -> dict:
    entry = {"kpi": kpi_id, "period": period, "action": "reject", "user": user, "ts": datetime.utcnow().isoformat()}
    storage.write(str(_signoff_path()), entry)
    log_metric("ir_signoff_reject")
    return entry


def is_approved(kpi_id: str) -> bool:
    path = _signoff_path()
    if not path.exists():
        return False
    lines = path.read_text().splitlines()
    for line in reversed(lines):
        data = json.loads(line)
        if data.get("kpi") == kpi_id:
            return data.get("action") == "approve"
    return False
