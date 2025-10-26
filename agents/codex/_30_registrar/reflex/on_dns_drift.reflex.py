"""Detect DNS drift and prepare HOLD signals."""

from __future__ import annotations

from typing import Dict, List

from ..pipelines.zone_sync import diff_zone


def detect_drift(current: Dict[str, list], desired: Dict[str, list]) -> List[dict]:
    """Return diffs that should trigger a HOLD if unexpected."""

    diffs = diff_zone(current, desired)
    if not diffs:
        return []
    return [{"reason": "dns_drift", "diff": diffs}]
