"""Convert Codex Storyteller episodes into lesson cards."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List

from ..pipelines.make_lessons import validate_card


def _base_card(episode: Dict[str, Any], segment: Dict[str, Any], index: int) -> Dict[str, Any]:
    """Construct the shared card payload before validation."""

    episode_id = episode.get("id", "episode")
    title = segment.get("title") or f"Episode Segment {index + 1}"
    return {
        "id": f"L-EP-{episode_id}-{index+1}",
        "title": title,
        "audience": segment.get("audience", episode.get("audience", "general")),
        "level": segment.get("level", "intro"),
        "context_links": episode.get("context_links", [episode.get("url", "./")]),
        "goals": segment.get("goals", episode.get("goals", [])) or ["Capture the core insight"],
        "energy_hint": segment.get("energy_hint", "Keep reflections under 1J."),
        "steps": segment.get(
            "steps",
            [
                {"type": "read", "content": segment.get("summary", "Review the segment transcript.")},
                {"type": "reflect", "content": "Note one question to ask the cohort."},
            ],
        ),
        "hints": segment.get("hints", ["Highlight the contradiction resolved in this segment."]),
        "exit_ticket": segment.get(
            "exit_ticket",
            "Describe how this episode segment changes your next build step.",
        ),
    }


def episode_to_lessons(episode: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Create lesson cards for each episode segment."""

    segments: Iterable[Dict[str, Any]] = episode.get("segments", []) or [episode]
    cards: List[Dict[str, Any]] = []
    for idx, segment in enumerate(segments):
        card = _base_card(episode, segment, idx)
        validate_card(card)
        cards.append(card)
    return cards


__all__ = ["episode_to_lessons"]
