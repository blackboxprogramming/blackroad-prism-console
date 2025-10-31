"""Reflex hook that converts Storyteller episodes into lessons."""

from __future__ import annotations

from typing import Any, Dict

from ..adapters.from_codex_episode import episode_to_lessons
from ..pipelines.make_lessons import write_cards

try:
    from lucidia.reflex.core import BUS, start
except ModuleNotFoundError:  # pragma: no cover - fallback for local runs.
    from .on_pr_merged.reflex import BUS, start  # type: ignore


@BUS.on("codex:episode.published")
def episode_lessons(event: Dict[str, Any]) -> None:
    """Emit lesson creation events for a Storyteller episode."""

    cards = episode_to_lessons(event)
    paths = write_cards(cards)
    for card, path in zip(cards, paths):
        BUS.emit("teacher:lesson.created", {"id": card["id"], "path": str(path)})


if __name__ == "__main__":
    start()
