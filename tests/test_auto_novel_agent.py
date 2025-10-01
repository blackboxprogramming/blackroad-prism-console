import pytest
from agents.auto_novel_agent import AutoNovelAgent


def test_add_supported_engine_enables_creation():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")
    agent.add_supported_engine("  Godot  ")
    assert "godot" in agent.list_supported_engines()
    agent.create_game("  GODOT  ")


def test_add_supported_engine_rejects_blank_names():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.add_supported_engine("   ")

    with pytest.raises(ValueError):
        agent.create_game("   ")
