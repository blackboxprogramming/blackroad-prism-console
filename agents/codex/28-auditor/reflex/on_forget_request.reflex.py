"""Reflex hook that attests right-to-forget operations."""

from __future__ import annotations

from datetime import datetime, timezone

from lucidia.reflex.core import BUS, start

from ..pipelines.mint_receipt import mint


@BUS.on("privacy:forget_request")
def forget(event: dict) -> None:
    """Emit a tombstone confirmation for data deletion events."""

    bundle = {
        "artifacts": [],
        "logs": [
            f"Forget request for subject={event.get('subject_id', 'unknown')}",
            event.get("notes", ""),
        ],
        "metrics": {},
        "metadata": {
            "pii_scrubbed": True,
            "subject_id": event.get("subject_id"),
            "request_id": event.get("request_id"),
            "deleted_at": datetime.now(timezone.utc).isoformat(),
        },
        "hashes": event.get("hashes", {}),
    }
    receipt = mint(bundle, ok=True)
    BUS.emit("privacy:tombstone.created", {"receipt": receipt, "bundle": bundle})


if __name__ == "__main__":
    start()
