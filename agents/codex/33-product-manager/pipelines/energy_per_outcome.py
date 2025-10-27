"""Compute energy-per-outcome trends and detect spikes."""
from __future__ import annotations

from statistics import mean
from typing import Any, Dict, Iterable, List


SPIKE_MULTIPLIER = 1.3
MIN_OBSERVATIONS = 3


def trend(history: Iterable[Dict[str, Any]]) -> Dict[str, float]:
    """Return average joules per outcome id."""
    totals: Dict[str, List[float]] = {}
    for sample in history:
        for outcome_id, joules in sample.get("outcomes", {}).items():
            totals.setdefault(outcome_id, []).append(float(joules))
    return {key: mean(values) for key, values in totals.items() if values}


def spike(event: Dict[str, Any]) -> bool:
    """Return True when energy spikes beyond the configured multiplier."""
    outcome_id = event.get("outcome_id")
    current = float(event.get("joules", 0))
    history = event.get("history", [])
    past_values = [float(item.get("joules", 0)) for item in history if item.get("outcome_id") == outcome_id]

    if len(past_values) < MIN_OBSERVATIONS:
        return False
    baseline = mean(past_values[-MIN_OBSERVATIONS:])
    if baseline == 0:
        return False
    return current > baseline * SPIKE_MULTIPLIER
