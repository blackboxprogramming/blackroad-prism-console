import pytest
from auto_novel_agent import AutoNovelAgent


def test_supported_engines_and_novel():
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == ["unity", "unreal"]
    summary = agent.write_novel("Quest", "Bob")
    assert summary == "Quest is a thrilling tale about Bob."


def test_create_game_validation():
    agent = AutoNovelAgent()
    agent.create_game("unity")
    with pytest.raises(ValueError):
        agent.create_game("godot")
    with pytest.raises(ValueError):
        agent.create_game("unity", include_weapons=True)
