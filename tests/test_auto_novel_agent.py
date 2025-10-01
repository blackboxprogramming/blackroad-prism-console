import pytest

from agents.auto_novel_agent import AutoNovelAgent


@pytest.fixture(autouse=True)
def reset_engines():
    """Ensure tests do not leak engine changes to each other."""
    AutoNovelAgent.reset_supported_engines()
    yield
    AutoNovelAgent.reset_supported_engines()


def test_add_supported_engine_enables_creation():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")
    agent.add_supported_engine("Godot")
    assert "godot" in agent.list_supported_engines()
    agent.create_game("godot")


def test_remove_supported_engine_blocks_creation():
    agent = AutoNovelAgent()
    agent.remove_supported_engine("unity")
    with pytest.raises(ValueError):
        agent.create_game("unity")
