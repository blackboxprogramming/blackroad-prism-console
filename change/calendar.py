from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import yaml

from tools import artifacts, storage


@dataclass
class Change:
    id: str
    service: str
    type: str
    start: str
    end: str
    owner: str
    risk: str
    approved: bool = False


CAL_PATH = Path("artifacts/change/calendar.jsonl")


def _load_windows() -> Dict:
    raw = storage.read("configs/maintenance_windows.yaml")
    return yaml.safe_load(raw) if raw else {}


def add_change(change: Change) -> None:
    artifacts.validate_and_write(str(CAL_PATH), asdict(change), "schemas/change.schema.json")


def list_changes(service: Optional[str] = None, start: Optional[str] = None, end: Optional[str] = None) -> List[Dict]:
    entries = []
    raw = storage.read(str(CAL_PATH))
    for line in raw.splitlines():
        if not line:
            continue
        data = json.loads(line)
        if service and data["service"] != service:
            continue
        if start and data["start"] < start:
            continue
        if end and data["end"] > end:
            continue
        entries.append(data)
    return entries


def conflicts(service: str) -> List[str]:
    windows = _load_windows()
    weekly = windows.get("weekly", {}).get(service, [])
    blackout = windows.get("blackout", [])
    issues: List[str] = []
    for ch in list_changes(service):
        day = datetime.fromisoformat(ch["start"]).strftime("%a")
        allowed = [w for w in weekly if w["day"] == day]
        in_window = any(
            w["start"] <= ch["start"][11:16] <= w["end"] and w["start"] <= ch["end"][11:16] <= w["end"]
            for w in allowed
        )
        if not in_window:
            issues.append(f"{ch['id']} outside window")
        if ch["start"][0:10] in blackout:
            issues.append(f"{ch['id']} in blackout")
    return issues
