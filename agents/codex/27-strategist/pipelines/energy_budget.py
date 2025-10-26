"""Energy budget forecasting helpers."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, Mapping


@dataclass
class EnergyBudget:
    """Represents a joule budget for a mission."""

    target: float
    maximum: float

    def health(self, forecast: float) -> str:
        """Return the energy posture given a forecast."""
        if forecast > self.maximum:
            return "critical"
        if forecast > self.target:
            return "warning"
        return "normal"


def project_spend(consumptions: Iterable[float]) -> float:
    """Compute the projected energy spend."""
    return float(sum(float(value) for value in consumptions))


def evaluate(consumptions: Iterable[float], budget: EnergyBudget) -> Dict[str, float]:
    """Return the forecast, variance to target, and variance to maximum."""
    forecast = project_spend(consumptions)
    return {
        "forecast": forecast,
        "variance_to_target": forecast - budget.target,
        "variance_to_max": forecast - budget.maximum,
    }


def alarm(consumptions: Iterable[float], budget: EnergyBudget) -> Mapping[str, object]:
    """Return an alarm payload for UI consumption."""
    metrics = evaluate(consumptions, budget)
    posture = budget.health(metrics["forecast"])
    suggestion = None
    if posture == "warning":
        suggestion = "shrink_scope"
    elif posture == "critical":
        suggestion = "halt_and_rollback"
    return {**metrics, "posture": posture, "suggestion": suggestion}


__all__ = ["EnergyBudget", "project_spend", "evaluate", "alarm"]
