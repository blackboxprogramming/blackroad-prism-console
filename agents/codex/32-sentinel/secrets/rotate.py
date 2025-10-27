"""Secret rotation scheduler for Sentinel."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Dict

DEFAULT_ROTATION_DAYS = 30


def next_rotation(last_rotated: datetime, *, days: int = DEFAULT_ROTATION_DAYS) -> datetime:
    """Return the timestamp for the next rotation window."""

    if last_rotated.tzinfo is None:
        last_rotated = last_rotated.replace(tzinfo=timezone.utc)
    return last_rotated + timedelta(days=days)


def should_rotate(last_rotated: datetime, now: datetime | None = None, *, days: int = DEFAULT_ROTATION_DAYS) -> bool:
    """Return True when a rotation is due."""

    now = now or datetime.now(timezone.utc)
    return now >= next_rotation(last_rotated, days=days)


def rotation_metadata(principal: str, last_rotated: datetime, *, days: int = DEFAULT_ROTATION_DAYS) -> Dict[str, object]:
    """Return a metadata payload suitable for receipts."""

    return {
        "principal": principal,
        "last_rotated": last_rotated.isoformat(),
        "next_rotation": next_rotation(last_rotated, days=days).isoformat(),
        "interval_days": days,
    }
