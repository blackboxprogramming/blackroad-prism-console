"""Energy estimation helpers for Codex-26."""

from __future__ import annotations

from typing import Dict

_JOULES_PER_TOKEN = 0.06
_BASELINE = 0.3


def estimate(text: str) -> float:
    """Estimate the energy cost in joules for the provided ``text``."""
    token_count = max(len(text.split()), 1)
    return round(_BASELINE + token_count * _JOULES_PER_TOKEN, 3)


def describe_budget(text: str) -> Dict[str, float]:
    """Return a budget report containing the estimate and allowance."""
    cost = estimate(text)
    return {"estimate_j": cost, "target_j": 1.2, "margin_j": round(1.2 - cost, 3)}


__all__ = ["estimate", "describe_budget"]
