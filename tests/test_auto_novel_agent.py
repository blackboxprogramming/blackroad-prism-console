"""Tests for the AutoNovelAgent class."""

import pytest

from agents.auto_novel_agent import AutoNovelAgent


@pytest.mark.parametrize(
    ("engine", "expected"),
    [
        ("unity", "Creating a Unity game without weapons..."),
        ("unreal", "Creating an Unreal game without weapons..."),
    ],
)
def test_create_game_supported_engines(engine: str, expected: str, capsys):
    """AutoNovelAgent creates games for supported engines without errors."""
    agent = AutoNovelAgent()
    agent.create_game(engine)
    captured = capsys.readouterr().out.strip()
    assert captured == expected


def test_create_game_unsupported_engine():
    """Creating a game with an unsupported engine raises ValueError."""
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Unsupported engine. Choose one of:"):
        agent.create_game("godot")


def test_create_game_with_weapons():
    """Creating a game with weapons enabled raises ValueError."""
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Weapons are not allowed"):
        agent.create_game("unity", include_weapons=True)


def test_list_supported_engines():
    """list_supported_engines returns the supported engines sorted alphabetically."""
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == ["unity", "unreal"]
