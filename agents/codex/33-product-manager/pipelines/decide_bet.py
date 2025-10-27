"""Decide whether a bet wins, pivots, or is killed based on results."""
from __future__ import annotations

from typing import Any, Dict



def decide(event: Dict[str, Any]) -> Dict[str, Any]:
    """Return a decision payload for the provided experiment result."""
    bet = event.get("bet", {})
    metrics = event.get("metrics", {})
    joules = event.get("joules", {})

    success_metric = bet.get("success", {}).get("metric")
    threshold = bet.get("success", {}).get("threshold")
    observed = metrics.get(success_metric)
    joules_spent = joules.get("spent", 0)
    joules_target = bet.get("joules_target", joules.get("target", 0))

    if observed is not None and threshold is not None and observed >= threshold:
        decision = "win"
        reason = f"Observed {observed} ≥ target {threshold}"
    elif joules_spent > joules_target * 2:
        decision = "kill"
        reason = "Energy spent exceeded 2× target"
    elif event.get("signal", "") == "weak":
        decision = "pivot"
        reason = "Signal weak for two cycles"
    else:
        decision = "pivot"
        reason = "Additional learning required"

    payload = {
        "bet_id": bet.get("id"),
        "decision": decision,
        "reason": reason,
        "metrics": metrics,
        "joules": {"spent": joules_spent, "target": joules_target},
        "receipts": event.get("receipts", []),
        "decided_at": event.get("decided_at"),
    }
    return payload


if __name__ == "__main__":  # pragma: no cover
    import json
    import sys

    result = json.load(sys.stdin)
    json.dump(decide(result), sys.stdout, indent=2)
