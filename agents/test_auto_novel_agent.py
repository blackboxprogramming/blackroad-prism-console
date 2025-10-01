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


def test_remove_supported_engine():
    agent = AutoNovelAgent()
    agent.add_supported_engine("godot")
    assert agent.supports_engine("godot")
    agent.remove_supported_engine("GoDoT")
    assert not agent.supports_engine("godot")
    with pytest.raises(ValueError):
        agent.create_game("godot")


def test_remove_supported_engine_errors_on_missing():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.remove_supported_engine("godot")


def test_supported_engines_are_instance_specific():
    agent_one = AutoNovelAgent()
    agent_two = AutoNovelAgent()

    agent_one.add_supported_engine("godot")

    assert agent_one.supports_engine("godot")
    assert not agent_two.supports_engine("godot")
