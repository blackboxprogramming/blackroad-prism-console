import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_list_supported_engines_sorted():
    agent = AutoNovelAgent()
    engines = agent.list_supported_engines()
    assert engines == sorted(engines)
    assert set(engines) == agent.SUPPORTED_ENGINES


def test_create_game_valid_engine(capsys):
    agent = AutoNovelAgent()
    agent.create_game("Unity")
    captured = capsys.readouterr()
    assert "Creating a Unity game without weapons" in captured.out


def test_create_game_unsupported_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError) as exc_info:
        agent.create_game("godot")
    assert "Unsupported engine" in str(exc_info.value)


def test_create_game_with_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError) as exc_info:
        agent.create_game("unreal", include_weapons=True)
    assert "Weapons are not allowed" in str(exc_info.value)


def test_deploy_prints_message(capsys):
    agent = AutoNovelAgent()
    agent.deploy()
    captured = capsys.readouterr()
    assert "AutoNovelAgent deployed and ready to generate novels!" in captured.out
