"""Risk token classifier used by the Strategist reflex hooks."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Mapping


@dataclass
class RiskThresholds:
    """Numeric KPI thresholds for risk classification."""

    amber: float
    red: float


DEFAULT_THRESHOLDS = RiskThresholds(amber=0.15, red=0.35)


def _extract_delta(event: Mapping[str, Any]) -> float:
    """Extract a normalised KPI delta from an event."""
    delta = event.get("delta")
    if delta is None:
        return 0.0
    try:
        return float(delta)
    except (TypeError, ValueError) as exc:
        raise ValueError("KPI delta must be numeric") from exc


def classify(event: Mapping[str, Any], thresholds: RiskThresholds = DEFAULT_THRESHOLDS) -> str:
    """Classify a KPI event into a Strategist risk token."""
    magnitude = abs(_extract_delta(event))
    if magnitude >= thresholds.red:
        return "red"
    if magnitude >= thresholds.amber:
        return "amber"
    return "green"


def apply_guardrail(event: Mapping[str, Any]) -> Dict[str, Any]:
    """Return a payload combining the token and original event."""
    token = classify(event)
    return {"token": token, "event": dict(event)}


__all__ = ["RiskThresholds", "DEFAULT_THRESHOLDS", "classify", "apply_guardrail"]
