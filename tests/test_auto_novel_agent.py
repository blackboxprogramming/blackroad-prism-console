"""Tests for the :mod:`agents.auto_novel_agent` module."""

import pytest

from agents.auto_novel_agent import AutoNovelAgent


@pytest.fixture(autouse=True)
def _reset_supported_engines():
    """Ensure ``SUPPORTED_ENGINES`` is reset between tests."""
    original = AutoNovelAgent.SUPPORTED_ENGINES.copy()
    try:
        yield
    finally:
        AutoNovelAgent.SUPPORTED_ENGINES = original


def test_supports_engine_default_engines() -> None:
    """The agent should support default engines in a case-insensitive manner."""
    agent = AutoNovelAgent()

    assert agent.supports_engine("Unity")
    assert agent.supports_engine("UNREAL")


def test_add_supported_engine_adds_lower_cased_entry() -> None:
    """Adding an engine should make the lowercase version available."""
    agent = AutoNovelAgent()

    agent.add_supported_engine("Godot")

    assert agent.supports_engine("godot")
    assert "godot" in agent.list_supported_engines()


def test_remove_supported_engine_discards_engine_if_present() -> None:
    """Removing an engine should prevent it from being reported as supported."""
    agent = AutoNovelAgent()
    agent.add_supported_engine("cryengine")

    agent.remove_supported_engine("CryEngine")

    assert not agent.supports_engine("cryengine")


def test_list_supported_engines_sorted() -> None:
    """Listing engines should return a sorted collection of engines."""
    agent = AutoNovelAgent()
    agent.add_supported_engine("cryengine")
    agent.add_supported_engine("godot")

    engines = agent.list_supported_engines()

    assert engines == sorted(engines)
    assert engines.count("godot") == 1
    assert engines.count("cryengine") == 1
