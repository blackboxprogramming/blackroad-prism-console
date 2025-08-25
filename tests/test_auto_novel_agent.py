import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_create_game_supported_engine(capsys):
    agent = AutoNovelAgent()
    agent.create_game("unity")
    captured = capsys.readouterr()
    assert "Creating a Unity game without weapons..." in captured.out


def test_create_game_unsupported_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")


def test_create_game_disallows_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("unity", include_weapons=True)


def test_list_supported_engines_sorted():
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == ["unity", "unreal"]


def test_add_engine():
    agent = AutoNovelAgent()
    agent.add_engine("godot")
    assert "godot" in agent.list_supported_engines()
    with pytest.raises(ValueError):
        agent.add_engine("godot")
    with pytest.raises(ValueError):
        agent.add_engine("")
