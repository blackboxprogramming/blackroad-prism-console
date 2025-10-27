"""Transform goal intents into a lightweight outcome tree."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from .utils import DATA_DIR, load_yaml, timestamp


@dataclass
class GoalIntent:
    """Representation of a goal intent event."""

    title: str
    metric: str
    horizon: str | None = None
    owner: str | None = None

    @classmethod
    def from_event(cls, event: Dict[str, Any]) -> "GoalIntent":
        payload = event.get("goal", {})
        return cls(
            title=payload.get("title", "Untitled Goal"),
            metric=payload.get("metric", ""),
            horizon=payload.get("horizon"),
            owner=payload.get("owner"),
        )


def _themes() -> List[str]:
    data = load_yaml(DATA_DIR / "themes.yaml")
    return data.get("themes", [])


def _audience_needs() -> Dict[str, List[str]]:
    data = load_yaml(DATA_DIR / "audiences.yaml")
    needs: Dict[str, List[str]] = {}
    for audience in data.get("audiences", []):
        name = audience.get("name")
        if not name:
            continue
        needs[name] = list(audience.get("needs", []))
    return needs


def build(event: Dict[str, Any]) -> Dict[str, Any]:
    """Return an outcome tree seeded with up to three initial bets."""
    intent = GoalIntent.from_event(event)
    themes = _themes()
    needs = _audience_needs()
    audience = event.get("audience") or next(iter(needs), "Primary")

    outcomes: List[Dict[str, Any]] = []
    base_outcomes = event.get("outcomes") or _default_outcomes(intent, audience, themes)
    for outcome in base_outcomes[:3]:
        outcomes.append(
            {
                "title": outcome["title"],
                "metric": outcome.get("metric", intent.metric or ""),
                "leading_indicators": list(outcome.get("leading_indicators", [])),
                "bets": list(outcome.get("bets", [])),
            }
        )

    return {
        "goal": {
            "title": intent.title,
            "metric": intent.metric,
            "horizon": intent.horizon,
            "owner": intent.owner,
            "theme_hint": themes[0] if themes else None,
        },
        "audience": audience,
        "outcomes": outcomes,
        "created_at": timestamp(),
    }


def _default_outcomes(intent: GoalIntent, audience: str, themes: List[str]) -> List[Dict[str, Any]]:
    """Generate default outcomes when none are provided."""
    theme = themes[0] if themes else "Focus"
    return [
        {
            "title": f"Increase {intent.metric or 'core metric'} for {audience}",
            "metric": intent.metric or "",
            "leading_indicators": [f"% of {audience} achieving aha moment"],
            "bets": [],
            "theme": theme,
        },
        {
            "title": "Shorten discovery loop",
            "metric": "cycle_time_days",
            "leading_indicators": ["avg research loop <= 5 days"],
            "bets": [],
            "theme": theme,
        },
        {
            "title": "Raise team clarity",
            "metric": "confidence_score",
            "leading_indicators": ["weekly recap published"],
            "bets": [],
            "theme": theme,
        },
    ]


if __name__ == "__main__":  # pragma: no cover
    import json
    import sys

    event_data = json.load(sys.stdin)
    json.dump(build(event_data), sys.stdout, indent=2)
