"""Maintenance window utilities."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from . import ARTIFACTS

CALENDAR = ARTIFACTS / "maintenance.json"


def next_window(
    service: str,
    action: str,
    calendar: Optional[List[dict]] = None,
) -> Optional[dict]:
    if calendar is None:
        if CALENDAR.exists():
            with open(CALENDAR, "r", encoding="utf-8") as fh:
                calendar = json.load(fh)
        else:
            calendar = []
    windows = [w for w in calendar if w.get("service") == service and w.get("action") in {action, "*"}]
    windows.sort(key=lambda w: w.get("start"))
    return windows[0] if windows else None
