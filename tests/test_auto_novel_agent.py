"""Tests for the AutoNovelAgent class."""
"""Tests for the :mod:`agents.auto_novel_agent` module."""

import pytest

from agents.auto_novel_agent import AutoNovelAgent


@pytest.fixture(autouse=True)
def reset_engines():
    """Ensure tests do not leak engine changes to each other."""
    AutoNovelAgent.SUPPORTED_ENGINES = {"unity", "unreal"}
    yield
    AutoNovelAgent.SUPPORTED_ENGINES = {"unity", "unreal"}


def test_supports_engine_case_insensitive():
    agent = AutoNovelAgent()
    assert agent.supports_engine("UNITY")
    assert agent.supports_engine("unreal")
    assert not agent.supports_engine("godot")
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


def test_remove_supported_engine_blocks_creation():
    agent = AutoNovelAgent()
    agent.remove_supported_engine("unity")
    with pytest.raises(ValueError):
        agent.create_game("unity")


def test_create_game_disallows_weapons():
@pytest.mark.parametrize(
    ("engine", "expected"),
    [
        ("unity", "Creating a Unity game without weapons..."),
        ("unreal", "Creating an Unreal game without weapons..."),
    ],
)
def test_create_game_supported_engines(engine: str, expected: str, capsys):
    """AutoNovelAgent creates games for supported engines without errors."""
    agent = AutoNovelAgent()
    agent.create_game(engine)
    captured = capsys.readouterr().out.strip()
    assert captured == expected


def test_create_game_unsupported_engine():
    """Creating a game with an unsupported engine raises ValueError."""
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Unsupported engine. Choose one of:"):
        agent.create_game("godot")


def test_create_game_with_weapons():
    """Creating a game with weapons enabled raises ValueError."""
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Weapons are not allowed"):
        agent.create_game("unity", include_weapons=True)


def test_create_game_rejects_unsupported_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("cryengine")


def test_generate_story_requires_theme():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.generate_story("")


def test_generate_story_series_produces_multiple_stories():
    agent = AutoNovelAgent()
    stories = agent.generate_story_series(["mystery", "space"], protagonist="Explorer")
    assert len(stories) == 2
    assert "Explorer" in stories[0]
    assert "mystery" in stories[0]
    assert "space" in stories[1]
def test_list_supported_engines():
    """list_supported_engines returns the supported engines sorted alphabetically."""
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == ["unity", "unreal"]
def test_remove_supported_engine_disables_creation():
    agent = AutoNovelAgent()
    agent.add_supported_engine("godot")
    agent.remove_supported_engine("godot")
    with pytest.raises(ValueError):
        agent.create_game("godot")
def test_create_game_supported_engine(capsys):
    agent = AutoNovelAgent()
    agent.create_game("unity")
    captured = capsys.readouterr()
    assert "Creating a Unity game without weapons..." in captured.out


def test_create_game_unsupported_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")


def test_create_game_empty_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("   ")


def test_create_game_disallows_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("unity", include_weapons=True)


def test_list_supported_engines_sorted():
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == ["unity", "unreal"]


def test_add_engine():
    agent = AutoNovelAgent()
    agent.add_engine("godot")
    assert "godot" in agent.list_supported_engines()
    with pytest.raises(ValueError):
        agent.add_engine("godot")
    with pytest.raises(ValueError):
        agent.add_engine("")


def test_add_engine_is_instance_scoped():
    agent_one = AutoNovelAgent()
    agent_two = AutoNovelAgent()
    agent_one.add_engine("godot")
    assert "godot" in agent_one.list_supported_engines()
    assert "godot" not in agent_two.list_supported_engines()


def test_create_game_normalizes_engine_name(capsys):
    agent = AutoNovelAgent()
    agent.create_game(" Unity ")
    captured = capsys.readouterr()
    assert "Creating a Unity game without weapons..." in captured.out


def test_add_engine_normalizes_name():
    agent = AutoNovelAgent()
    agent.add_engine(" Godot ")
    assert "godot" in agent.list_supported_engines()
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
