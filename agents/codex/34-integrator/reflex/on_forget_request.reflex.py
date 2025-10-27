"""Reflex hook: emit tombstone receipts when forget requests arrive."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict

from .bus import BUS


@BUS.on("privacy:forget")
def handle_forget(event: Dict[str, object]) -> None:
    subject = event.get("subject", "unknown")
    receipt = {
        "receipt_id": f"tombstone-{subject}",
        "event_id": event.get("event_id", "n/a"),
        "status": "failed",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "energy_j": 0.0,
        "consent": {"scopes": [], "ttl_seconds": 0},
        "notes": "Forgetting subject as requested",
    }
    BUS.emit("integrator:forgotten", {"who": subject, "receipt": receipt})
