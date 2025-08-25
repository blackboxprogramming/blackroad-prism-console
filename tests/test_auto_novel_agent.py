import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_deploy_outputs_greeting(capsys):
    agent = AutoNovelAgent()
    agent.deploy()
    captured = capsys.readouterr()
    assert "AutoNovelAgent deployed and ready to generate novels!" in captured.out


def test_list_supported_engines_sorted():
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == ["unity", "unreal"]


def test_create_game_with_supported_engine(capsys):
    agent = AutoNovelAgent()
    agent.create_game("UNITY")
    captured = capsys.readouterr()
    assert "Creating a Unity game without weapons..." in captured.out


def test_create_game_rejects_unknown_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Unsupported engine"):
        agent.create_game("godot")


def test_create_game_rejects_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Weapons are not allowed"):
        agent.create_game("unity", include_weapons=True)
