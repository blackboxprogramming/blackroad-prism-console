"""Tests for the AutoNovelAgent bot."""

import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_list_supported_engines() -> None:
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == ["unity", "unreal"]


def test_create_game_supported_engine(capsys: pytest.CaptureFixture[str]) -> None:
    agent = AutoNovelAgent()
    agent.create_game("Unity")
    captured = capsys.readouterr()
    assert "Creating a Unity game without weapons..." in captured.out


def test_create_game_unsupported_engine() -> None:
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")


def test_create_game_with_weapons() -> None:
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("unity", include_weapons=True)
