import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_deploy_prints_message(capfd):
    agent = AutoNovelAgent()
    agent.deploy()
    captured = capfd.readouterr()
    assert "deployed and ready" in captured.out


def test_create_game_with_supported_engine(capfd):
    agent = AutoNovelAgent()
    agent.create_game("unity")
    captured = capfd.readouterr()
    assert "Creating a Unity game without weapons" in captured.out


def test_create_game_with_unsupported_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError) as exc:
        agent.create_game("godot")
    assert "Unsupported engine" in str(exc.value)


def test_create_game_with_weapons_disallowed():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError) as exc:
        agent.create_game("unity", include_weapons=True)
    assert "Weapons are not allowed" in str(exc.value)


def test_list_supported_engines_sorted():
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == ["unity", "unreal"]
