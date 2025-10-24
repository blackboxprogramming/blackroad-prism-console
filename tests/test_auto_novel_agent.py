"""Tests for the AutoNovelAgent class."""
"""Tests for the :mod:`agents.auto_novel_agent` module."""
"""Tests for :mod:`agents.auto_novel_agent`."""

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


import pytest
from agents.auto_novel_agent import AutoNovelAgent


@pytest.fixture(autouse=True)
def reset_supported_engines():
    """Reset class-level supported engines before each test."""

    AutoNovelAgent.SUPPORTED_ENGINES = {"unity", "unreal"}


import pytest
from agents.auto_novel_agent import AutoNovelAgent


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
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Weapons are not allowed"):
def test_list_supported_engines_sorted():
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == sorted(agent.SUPPORTED_ENGINES)


def test_create_game_invalid_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("godot")


def test_create_game_with_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("unity", include_weapons=True)


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


def test_generate_story_series_rejects_blank_theme():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Each theme must be a non-empty string"):
        agent.generate_story_series(["mystery", "   "], protagonist="Explorer")

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
def test_deploy_outputs_greeting(capsys):
    agent = AutoNovelAgent()
    agent.deploy()
    captured = capsys.readouterr()
    assert "AutoNovelAgent deployed and ready to generate novels!" in captured.out


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
def test_create_game_with_supported_engine(capsys):
    agent = AutoNovelAgent()
    agent.create_game("UNITY")
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
@pytest.fixture()
def agent() -> AutoNovelAgent:
    """Return a fresh ``AutoNovelAgent`` instance for each test."""

    return AutoNovelAgent()


def test_deploy_prints_message(agent: AutoNovelAgent, capfd: pytest.CaptureFixture[str]) -> None:
    agent.deploy()
    captured = capfd.readouterr()
    assert "deployed and ready" in captured.out


@pytest.mark.parametrize(
    "engine_name",
    ["unity", "UNITY", "unreal", "UNREAL"],
)
def test_create_game_with_supported_engine_is_case_insensitive(
    agent: AutoNovelAgent, engine_name: str, capfd: pytest.CaptureFixture[str]
) -> None:
    agent.create_game(engine_name)
    captured = capfd.readouterr()
    expected_fragment = f"Creating a {engine_name.lower().capitalize()} game without weapons"
    assert expected_fragment in captured.out


def test_create_game_with_unsupported_engine(agent: AutoNovelAgent) -> None:
    with pytest.raises(ValueError) as exc:
        agent.create_game("godot")
    assert "Unsupported engine" in str(exc.value)


def test_create_game_with_weapons_disallowed(agent: AutoNovelAgent) -> None:
    with pytest.raises(ValueError) as exc:
        agent.create_game("unity", include_weapons=True)
    assert "Weapons are not allowed" in str(exc.value)


def test_list_supported_engines_sorted(agent: AutoNovelAgent) -> None:
    assert agent.list_supported_engines() == ["unity", "unreal"]


def test_list_supported_engines_returns_fresh_copy(agent: AutoNovelAgent) -> None:
    engines = agent.list_supported_engines()
    engines.append("godot")

    # The agent should not expose internal state that can be mutated from callers.
    assert "godot" not in agent.list_supported_engines()
def test_create_game_rejects_invalid_engine():
    agent = AutoNovelAgent()
def test_remove_supported_engine_disallows_creation():
    agent = AutoNovelAgent()
    agent.add_supported_engine("Godot")
    agent.remove_supported_engine("godot")
    with pytest.raises(ValueError):
def test_create_game_rejects_unknown_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Unsupported engine"):
        agent.create_game("godot")


def test_create_game_rejects_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("unity", include_weapons=True)


def test_generate_story_uses_protagonist():
    agent = AutoNovelAgent()
    story = agent.generate_story("an ancient temple", protagonist="Lara")
    assert "Lara" in story
    assert story.startswith("an ancient temple")


def test_generate_story_rejects_blank_prompt():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.generate_story("   ")


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

    agent.add_supported_engine("  Godot  ")
    assert "godot" in agent.list_supported_engines()
    agent.create_game("  GODOT  ")


def test_add_supported_engine_rejects_blank_names():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.add_supported_engine("   ")

    with pytest.raises(ValueError):
        agent.create_game("   ")
def test_remove_supported_engine_unknown_engine_error():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Supported engines: unity, unreal"):
        agent.remove_supported_engine("cryengine")
    original = AutoNovelAgent.SUPPORTED_ENGINES.copy()
    yield
    AutoNovelAgent.SUPPORTED_ENGINES = original


def test_default_supported_engines():
    agent = AutoNovelAgent()
    assert agent.list_supported_engines() == ["godot", "unity", "unreal"]


def test_add_engine_and_list():
    agent = AutoNovelAgent()
    agent.add_engine("cryengine")
    assert "cryengine" in agent.list_supported_engines()


def test_add_engine_rejects_blank_name():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.add_engine("   ")


def test_add_engine_normalizes_case():
    agent = AutoNovelAgent()
    agent.add_engine("CRYENGINE")
    assert "cryengine" in agent.list_supported_engines()
    assert all(engine == engine.lower() for engine in AutoNovelAgent.SUPPORTED_ENGINES)


def test_invalid_engine_raises():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("cryengine")


def test_weapons_not_allowed():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.create_game("unity", include_weapons=True)
        ("Unreal", "Creating an Unreal game without weapons..."),
        ("Unity", "Creating a Unity game without weapons..."),
    ],
)
def test_create_game_returns_and_prints_message(engine, expected, capsys):
    agent = AutoNovelAgent()
    result = agent.create_game(engine)
    captured = capsys.readouterr().out.strip()

    assert result == expected
    assert captured == expected
def test_generate_novel_outline_returns_expected_headings():
    agent = AutoNovelAgent()

    outline = agent.generate_novel_outline("The Quest", chapters=2)

    assert outline == ["Chapter 1: The Quest", "Chapter 2: The Quest"]


def test_generate_novel_outline_rejects_zero_chapters():
    agent = AutoNovelAgent()

    with pytest.raises(ValueError, match="Number of chapters must be at least 1"):
        agent.generate_novel_outline("Adventure", chapters=0)


def test_generate_novel_outline_rejects_blank_title():
    agent = AutoNovelAgent()

    with pytest.raises(ValueError, match="Title must be a non-empty string"):
        agent.generate_novel_outline("   ")


def test_validate_scopes_accepts_least_privilege_subset():
    agent = AutoNovelAgent()

    agent.validate_scopes(["outline:read"])


def test_validate_scopes_rejects_broad_scope():
    agent = AutoNovelAgent()

    with pytest.raises(ValueError, match="Invalid scopes: admin"):
        agent.validate_scopes(["outline:read", "admin"])
    with pytest.raises(ValueError, match="Weapons are not allowed"):
        agent.create_game("unity", include_weapons=True)
