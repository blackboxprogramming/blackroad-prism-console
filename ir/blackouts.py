from __future__ import annotations
from datetime import date, datetime
from pathlib import Path
from typing import List
import os
import yaml

from .utils import ROOT

CONFIG_PATH = ROOT / "configs" / "ir" / "blackouts.yaml"


def _load() -> dict:
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return yaml.safe_load(f)
    return {"quiet_periods": [], "blackouts": []}


def status(d: str) -> str:
    cfg = _load()
    dt = datetime.fromisoformat(d).date()
    for bo in cfg.get("blackouts", []):
        if datetime.fromisoformat(bo).date() == dt:
            return "IR_BLACKOUT_BLOCK"
    for qp in cfg.get("quiet_periods", []):
        qs = datetime.fromisoformat(qp["start"]).date()
        qe = datetime.fromisoformat(qp["end"]).date()
        if qs <= dt <= qe:
            return "IR_QUIET_PERIOD"
    return "OPEN"


def enforce(action: str, d: str | None = None) -> None:
    d = d or os.environ.get("IR_TODAY") or date.today().isoformat()
    st = status(d)
    if st != "OPEN":
        raise PermissionError(st)
