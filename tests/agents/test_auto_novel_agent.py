"""Tests for the :mod:`agents.auto_novel_agent` module."""

import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_add_supported_engine_registers_engine() -> None:
    """Adding a new engine should make it available for game creation."""
    agent = AutoNovelAgent()
    agent.add_supported_engine("Godot")

    assert "godot" in agent.SUPPORTED_ENGINES

    # Should not raise when creating a game with the new engine
    agent.create_game("godot")


def test_create_game_rejects_unsupported_engine() -> None:
    """Creating a game with an unsupported engine raises a ``ValueError``."""
    agent = AutoNovelAgent()

    with pytest.raises(ValueError):
        agent.create_game("cryengine")
