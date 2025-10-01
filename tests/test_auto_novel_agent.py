import pytest

from agents.auto_novel_agent import AutoNovelAgent


def test_add_engine():
    agent = AutoNovelAgent()
    agent.add_engine("godot")
    assert "godot" in agent.list_supported_engines()


def test_add_engine_is_instance_scoped_and_case_insensitive():
    first_agent = AutoNovelAgent()
    first_agent.add_engine("  Godot  ")
    assert "godot" in first_agent.list_supported_engines()

    second_agent = AutoNovelAgent()
    assert "godot" not in second_agent.list_supported_engines()
    with pytest.raises(ValueError):
        second_agent.create_game("GODOT")  # should fail until added

    second_agent.add_engine("GODOT")
    assert "godot" in second_agent.list_supported_engines()
    second_agent.create_game("godot")  # no error after adding


def test_add_engine_rejects_empty_names():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.add_engine("   ")

