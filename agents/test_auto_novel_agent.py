"""Tests for the AutoNovelAgent class."""

import pytest
from auto_novel_agent import AutoNovelAgent


@pytest.fixture(autouse=True)
def reset_supported_engines():
    """Ensure each test starts with the default engine set."""

    original = AutoNovelAgent.SUPPORTED_ENGINES.copy()
    yield
    AutoNovelAgent.SUPPORTED_ENGINES = original.copy()


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
    with pytest.raises(ValueError) as excinfo:
        agent.create_game("cryengine")

    message = str(excinfo.value)
    assert "Unsupported engine 'cryengine'" in message
    assert "Supported engines:" in message
    assert "add_supported_engine" in message


def test_create_game_requires_engine_name():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Engine name must be a non-empty string."):
        agent.create_game("   ")


def test_generate_story_requires_theme():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.generate_story("")

def test_remove_supported_engine():
    agent = AutoNovelAgent()
    agent.add_supported_engine("godot")
    agent.remove_supported_engine("godot")
    assert not agent.supports_engine("godot")


def test_remove_unsupported_engine_raises():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.remove_supported_engine("godot")
    with pytest.raises(ValueError):
        agent.create_game("cryengine")


def test_remove_supported_engine():
    """Removing an engine should make it unsupported for that agent."""
    agent = AutoNovelAgent(supported_engines={"unity", "unreal"})
    agent.remove_supported_engine("unity")
    assert not agent.supports_engine("unity")
