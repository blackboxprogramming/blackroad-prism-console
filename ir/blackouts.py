from __future__ import annotations
from datetime import datetime, date
from pathlib import Path
import yaml
from typing import Optional

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "configs" / "ir" / "blackouts.yaml"


def load_config() -> dict:
    if CONFIG_PATH.exists():
        return yaml.safe_load(CONFIG_PATH.read_text())
    return {"quiet_periods": [], "blackouts": []}


def status(check_date: str) -> Optional[str]:
    cfg = load_config()
    dt = datetime.strptime(check_date, "%Y-%m-%d").date()
    for win in cfg.get("blackouts", []):
        start = date.fromisoformat(str(win["start"]))
        end = date.fromisoformat(str(win["end"]))
        if start <= dt <= end:
            return "IR_BLACKOUT_BLOCK"
    for win in cfg.get("quiet_periods", []):
        start = date.fromisoformat(str(win["start"]))
        end = date.fromisoformat(str(win["end"]))
        if start <= dt <= end:
            return "IR_QUIET_PERIOD"
    return None


def enforce(check_date: date, mode: str) -> None:
    code = status(check_date.isoformat())
    if code:
        raise RuntimeError(code)
