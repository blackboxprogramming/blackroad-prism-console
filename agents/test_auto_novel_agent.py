"""Tests for the AutoNovelAgent class."""

import pytest
from auto_novel_agent import AutoNovelAgent


def test_supports_engine_case_insensitive():
    agent = AutoNovelAgent()
    assert agent.supports_engine("UNITY")
    assert agent.supports_engine("unreal")
    assert not agent.supports_engine("godot")


def test_add_supported_engine_and_create_game(capsys):
    agent = AutoNovelAgent()
    agent.add_supported_engine("godot")
    assert agent.supports_engine("Godot")
    agent.create_game("godot")
    captured = capsys.readouterr()
    assert "Godot" in captured.out


def test_create_game_disallows_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Weapons are not allowed"):
        agent.create_game("unity", include_weapons=True)


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
