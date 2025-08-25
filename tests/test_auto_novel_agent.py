import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_create_game_rejects_invalid_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")


def test_create_game_rejects_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("unity", include_weapons=True)


def test_generate_story_uses_protagonist():
    agent = AutoNovelAgent()
    story = agent.generate_story("an ancient temple", protagonist="Lara")
    assert "Lara" in story
    assert story.startswith("An ancient temple")
