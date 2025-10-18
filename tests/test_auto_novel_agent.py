"""Tests for the AutoNovelAgent class."""

import pytest

from agents.auto_novel_agent import AutoNovelAgent


@pytest.fixture(autouse=True)
def reset_engines():
    """Ensure tests do not leak engine changes to each other."""
    AutoNovelAgent.SUPPORTED_ENGINES = {"unity", "unreal"}
    yield
    AutoNovelAgent.SUPPORTED_ENGINES = {"unity", "unreal"}


def test_supports_engine_case_insensitive():
    agent = AutoNovelAgent()
    assert agent.supports_engine("UNITY")
    assert agent.supports_engine("unreal")
    assert not agent.supports_engine("godot")


def test_add_supported_engine_enables_creation():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")
    agent.add_supported_engine("Godot")
    assert "godot" in agent.list_supported_engines()
    agent.create_game("godot")


def test_remove_supported_engine_blocks_creation():
    agent = AutoNovelAgent()
    agent.remove_supported_engine("unity")
    with pytest.raises(ValueError):
        agent.create_game("unity")


def test_create_game_disallows_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Weapons are not allowed"):
        agent.create_game("unity", include_weapons=True)


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


def test_create_game_rejects_unsupported_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("cryengine")


def test_generate_story_requires_theme():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.generate_story("")


def test_generate_story_series_produces_multiple_stories():
    agent = AutoNovelAgent()
    stories = agent.generate_story_series(["mystery", "space"], protagonist="Explorer")
    assert len(stories) == 2
    assert "Explorer" in stories[0]
    assert "mystery" in stories[0]
    assert "space" in stories[1]


def test_generate_story_series_rejects_blank_theme():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Each theme must be a non-empty string"):
        agent.generate_story_series(["mystery", "   "], protagonist="Explorer")

def test_list_supported_engines():
    """list_supported_engines returns the supported engines sorted alphabetically."""
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == ["unity", "unreal"]
