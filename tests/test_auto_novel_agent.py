import pytest
from agents.auto_novel_agent import AutoNovelAgent


@pytest.fixture(autouse=True)
def reset_supported_engines():
    """Reset class-level supported engines before each test."""

    AutoNovelAgent.SUPPORTED_ENGINES = {"unity", "unreal"}


def test_add_supported_engine_enables_creation():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")
    agent.add_supported_engine("Godot")
    assert "godot" in agent.list_supported_engines()
    agent.create_game("godot")


def test_remove_supported_engine_disallows_creation():
    agent = AutoNovelAgent()
    agent.add_supported_engine("Godot")
    agent.remove_supported_engine("godot")
    with pytest.raises(ValueError):
        agent.create_game("godot")


def test_remove_supported_engine_unknown_engine_error():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Supported engines: unity, unreal"):
        agent.remove_supported_engine("cryengine")
