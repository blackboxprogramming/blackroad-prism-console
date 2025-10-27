"""Estimate joules spent per sync item."""
from __future__ import annotations

import json
from typing import Any, Dict


BASELINE_J = 0.18
PER_KB_J = 0.04


def estimate(event: Dict[str, Any]) -> float:
    """Estimate the joule cost of processing a normalized event."""

    serialized = json.dumps(event, sort_keys=True)
    kilo_bytes = max(len(serialized) / 1024, 0.1)
    energy = BASELINE_J + PER_KB_J * kilo_bytes
    return round(energy, 3)


__all__ = ["estimate", "BASELINE_J", "PER_KB_J"]
