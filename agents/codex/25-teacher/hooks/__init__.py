"""Reflex hooks for Codex-25 Teacher."""

from .on_episode_published.reflex import episode_lessons
from .on_pr_merged.reflex import build_lessons
from .on_quiz_submitted.reflex import adapt_path

__all__ = ["adapt_path", "build_lessons", "episode_lessons"]
