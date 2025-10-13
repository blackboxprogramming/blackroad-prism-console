"""Lightweight in-process counters for operational telemetry."""

from __future__ import annotations

from collections import Counter
from typing import Dict

_COUNTERS: Counter[str] = Counter()


def increment(metric: str, *, amount: int = 1) -> None:
    """Increment ``metric`` by ``amount`` (default: 1)."""

    if amount < 0:
        raise ValueError("amount must be non-negative")
    if amount:
        _COUNTERS[metric] += amount


def snapshot() -> Dict[str, int]:
    """Return a copy of the current counter values."""

    return dict(_COUNTERS)


__all__ = ["increment", "snapshot"]
