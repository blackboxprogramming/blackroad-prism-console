"""Emit alerts for deadlines approaching."""

from __future__ import annotations

import datetime as dt
from typing import List

from ..pipelines.calendar_emit import due_events


def emit_deadline_alerts(today: dt.date | None = None) -> List[dict]:
    """Return events within the default 7 day window."""

    events = due_events(today=today)
    alerts: List[dict] = []
    for event in events:
        alerts.append(
            {
                "id": event["uid"],
                "summary": event["summary"],
                "when": event["start"],
            }
        )
    return alerts
