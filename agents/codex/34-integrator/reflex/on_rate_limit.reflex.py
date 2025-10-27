"""Reflex hook: apply backoff when connectors signal rate limits."""
from __future__ import annotations

from datetime import datetime
from typing import Dict

from .bus import BUS


@BUS.on("connector:rate.limit")
def handle_rate_limit(event: Dict[str, object]) -> None:
    reset_at = event.get("reset_at")
    if isinstance(reset_at, str):
        try:
            datetime.fromisoformat(reset_at.replace("Z", "+00:00"))
        except ValueError:  # pragma: no cover - defensive
            reset_at = None
    BUS.emit("integrator:backoff", {"source": event.get("source"), "until": reset_at})
