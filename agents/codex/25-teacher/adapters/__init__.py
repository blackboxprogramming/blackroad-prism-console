"""Adapters turning Codex and Guardian artifacts into lesson data."""

from .from_codex_episode import episode_to_lessons
from .from_guardian_contradiction import contradiction_to_card

__all__ = ["contradiction_to_card", "episode_to_lessons"]
