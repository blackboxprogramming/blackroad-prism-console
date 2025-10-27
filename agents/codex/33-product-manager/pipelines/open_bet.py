"""Create initial bets derived from an outcome tree."""
from __future__ import annotations

import itertools
from typing import Any, Dict, Iterable, List

from .utils import timestamp

DEFAULT_JOULES = 200


def _ensure_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def open_bets(tree: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Return up to three open bets with guardrails and kill criteria."""
    outcomes = tree.get("outcomes", [])
    candidate_titles = list(
        itertools.islice(
            (
                outcome.get("title", "Untitled Outcome")
                for outcome in outcomes
            ),
            3,
        )
    )

    bets: List[Dict[str, Any]] = []
    for idx, title in enumerate(candidate_titles, start=1):
        bets.append(
            {
                "id": f"bet-{idx}",
                "title": title,
                "emoji": "🎯",
                "hypothesis": f"If we focus on '{title}' we move the outcome metric",
                "for_user": tree.get("audience", "Primary"),
                "expected_outcome": title,
                "guardrails": {"ethics": True, "privacy": True, "notes": "baseline"},
                "joules_target": tree.get("goal", {}).get("joules_target", DEFAULT_JOULES),
                "test": {"method": "prototype", "sample_size": 5, "timebox_days": 5},
                "success": {"metric": tree.get("goal", {}).get("metric", ""), "threshold": 1.05},
                "kill": {
                    "criteria": [
                        "no-signal-2-cycles",
                        "energy>2×target and value<median",
                    ]
                },
                "receipts": [],
                "status": "open",
                "owner": tree.get("goal", {}).get("owner", "codex-33"),
                "start_date": timestamp().split("T")[0],
            }
        )
    return bets


def attach_bets(tree: Dict[str, Any], bets: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    """Attach bet references to the first outcome slots."""
    result = {**tree}
    outcomes = result.get("outcomes", [])
    for outcome, bet in zip(outcomes, bets):
        refs = _ensure_list(outcome.get("bets"))
        refs.append({"id": bet["id"], "title": bet["title"], "status": bet["status"]})
        outcome["bets"] = refs
    result["outcomes"] = outcomes
    return result


if __name__ == "__main__":  # pragma: no cover
    import json
    import sys

    tree = json.load(sys.stdin)
    bets = open_bets(tree)
    output = attach_bets(tree, bets)
    json.dump({"bets": bets, "tree": output}, sys.stdout, indent=2)
