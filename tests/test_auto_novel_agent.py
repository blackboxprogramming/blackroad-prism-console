import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_list_supported_engines_sorted():
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == sorted(agent.SUPPORTED_ENGINES)


def test_create_game_valid_engine(capsys):
    agent = AutoNovelAgent()
    agent.create_game("Unreal")
    captured = capsys.readouterr().out
    assert "Creating a Unreal game without weapons" in captured


def test_create_game_invalid_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")


def test_create_game_with_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("unity", include_weapons=True)
