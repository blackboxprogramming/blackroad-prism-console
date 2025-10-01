import pytest
from agents.auto_novel_agent import AutoNovelAgent


@pytest.fixture(autouse=True)
def reset_supported_engines():
    """Restore ``SUPPORTED_ENGINES`` after each test."""

    original = AutoNovelAgent.SUPPORTED_ENGINES.copy()
    yield
    AutoNovelAgent.SUPPORTED_ENGINES = original.copy()


def test_add_supported_engine_enables_creation():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")
    agent.add_supported_engine("Godot")
    assert "godot" in agent.list_supported_engines()
    agent.create_game("godot")


def test_remove_supported_engine_disables_creation():
    agent = AutoNovelAgent()
    agent.add_supported_engine("godot")
    agent.remove_supported_engine("godot")
    with pytest.raises(ValueError):
        agent.create_game("godot")
