"""Unit tests for :mod:`agents.auto_novel_agent`."""

import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_write_short_story_trims_theme() -> None:
    """The generated story should include the trimmed theme twice."""
    agent = AutoNovelAgent()
    story = agent.write_short_story("  friendship   ")
    assert story.count("friendship") == 2


def test_write_short_story_requires_theme() -> None:
    """Providing an empty theme should raise a :class:`ValueError`."""
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.write_short_story("   ")
