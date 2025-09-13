from __future__ import annotations
from pathlib import Path
from datetime import datetime
import json
from typing import Dict

from .utils import IR_ARTIFACTS, log_metric

SIGNOFF_PATH = IR_ARTIFACTS / "signoff.jsonl"


def _append(entry: Dict) -> None:
    with SIGNOFF_PATH.open("a") as f:
        f.write(json.dumps(entry) + "\n")


def request_signoff(kpi_id: str, period: str, requester: str = "system") -> None:
    entry = {
        "kpi": kpi_id,
        "period": period,
        "status": "requested",
        "who": requester,
        "when": datetime.utcnow().isoformat(),
    }
    _append(entry)
    log_metric("ir_signoff_req")


def approve(kpi_id: str, period: str, user: str) -> None:
    entry = {
        "kpi": kpi_id,
        "period": period,
        "status": "approved",
        "who": user,
        "when": datetime.utcnow().isoformat(),
    }
    _append(entry)
    log_metric("ir_signoff_approve")


def reject(kpi_id: str, period: str, user: str) -> None:
    entry = {
        "kpi": kpi_id,
        "period": period,
        "status": "rejected",
        "who": user,
        "when": datetime.utcnow().isoformat(),
    }
    _append(entry)
    log_metric("ir_signoff_reject")
