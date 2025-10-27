"""Generate structured release notes from release events."""
from __future__ import annotations

from typing import Any, Dict, List

from .utils import timestamp


DEFAULT_BADGES = ["🟢OutcomeWon"]


def make_note(event: Dict[str, Any]) -> Dict[str, Any]:
    """Return a release note document ready for serialization."""
    metrics = event.get("metrics", {})
    energy = event.get("energy", {})
    lessons = _ensure_list(event.get("lessons")) or ["Document follow-up interviews"]
    badges = _ensure_list(event.get("badges")) or DEFAULT_BADGES
    approvals = event.get("approvals", {})

    return {
        "version": event.get("version", "v0.0.1"),
        "date": event.get("date", timestamp().split("T")[0]),
        "outcome": event.get("outcome", ""),
        "metrics": {
            "primary": metrics.get("primary", ""),
            "secondary": _ensure_list(metrics.get("secondary")),
        },
        "energy": {
            "target": energy.get("target", 0),
            "joules_spent": energy.get("spent", 0),
            "scope_changes": _ensure_list(energy.get("scope_changes")),
        },
        "lessons": lessons,
        "badges": badges,
        "approvals": {
            "teacher": approvals.get("teacher", "pending"),
            "designer": approvals.get("designer", "pending"),
            "auditor": approvals.get("auditor", "pending"),
            "sentinel": approvals.get("sentinel", "pending"),
        },
    }


def _ensure_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]
