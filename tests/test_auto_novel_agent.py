"""Tests for :mod:`agents.auto_novel_agent`."""

import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_add_engine_and_create_game(capsys):
    agent = AutoNovelAgent()
    agent.add_engine("Godot")
    assert "godot" in agent.SUPPORTED_ENGINES
    agent.create_game("godot")
    captured = capsys.readouterr()
    assert "Creating a Godot game without weapons" in captured.out


def test_add_engine_invalid():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.add_engine("unity")
    with pytest.raises(ValueError):
        agent.add_engine("engine-1")


def test_add_engine_is_instance_scoped():
    first_agent = AutoNovelAgent()
    first_agent.add_engine("RenPy")

    second_agent = AutoNovelAgent()
    assert "renpy" not in second_agent.list_supported_engines()


def test_create_game_unknown_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("unknown")
