"""Unit tests for :mod:`auto_novel_agent`."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

AGENTS_DIR = Path(__file__).resolve().parent
if str(AGENTS_DIR) not in sys.path:
    sys.path.insert(0, str(AGENTS_DIR))

from auto_novel_agent import AutoNovelAgent


@pytest.fixture()
def agent() -> AutoNovelAgent:
    """Return a fresh agent for each test."""

    return AutoNovelAgent()


def test_supports_engine_case_insensitive(agent: AutoNovelAgent) -> None:
    """Engine lookups should ignore casing."""

    assert agent.supports_engine("UNITY")
    assert agent.supports_engine("unreal")
    assert not agent.supports_engine("godot")


def test_add_supported_engine_and_create_game(agent: AutoNovelAgent, capsys: pytest.CaptureFixture[str]) -> None:
    """New engines can be added and used to create games."""

    agent.add_supported_engine("godot")
    message = agent.create_game("godot")
    captured = capsys.readouterr()
    assert "Godot" in message
    assert message in captured.out


def test_create_game_disallows_weapons(agent: AutoNovelAgent) -> None:
    """Weaponised games are rejected."""

def test_remove_supported_engine():
    agent = AutoNovelAgent()
    agent.add_supported_engine("godot")
    agent.remove_supported_engine("godot")
    assert not agent.supports_engine("godot")


def test_remove_supported_engine_raises_for_unknown_engine():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Engine 'godot' is not supported"):
        agent.remove_supported_engine("godot")


def test_add_supported_engine_rejects_empty_string():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError):
        agent.add_supported_engine("   ")


def test_add_supported_engine_rejects_non_string():
    agent = AutoNovelAgent()
    with pytest.raises(TypeError):
        agent.add_supported_engine(None)


def test_create_game_disallows_weapons():
    agent = AutoNovelAgent()
    with pytest.raises(ValueError, match="Weapons are not allowed"):
        agent.create_game("unity", include_weapons=True)


def test_create_game_rejects_unsupported_engine(agent: AutoNovelAgent) -> None:
    """Unsupported engines raise a descriptive error."""

    with pytest.raises(ValueError) as excinfo:
        agent.create_game("cryengine")

    message = str(excinfo.value)
    assert "Unsupported engine 'cryengine'" in message
    assert "Use add_supported_engine" in message


def test_create_game_requires_engine_name(agent: AutoNovelAgent) -> None:
    """Blank engine names are not permitted."""

    with pytest.raises(ValueError, match="Engine name must be a non-empty string."):
        agent.create_game("   ")


def test_remove_supported_engine(agent: AutoNovelAgent) -> None:
    """Removing an engine makes it unavailable for future games."""

    agent.add_supported_engine("godot")
    assert agent.supports_engine("godot")
    agent.remove_supported_engine("GoDoT")
    assert not agent.supports_engine("godot")


def test_remove_supported_engine_errors_when_unknown(agent: AutoNovelAgent) -> None:
    """Attempting to remove a missing engine raises a helpful error."""

    with pytest.raises(ValueError, match="Supported engines: unity, unreal"):
        agent.remove_supported_engine("cryengine")


def test_generate_story_requires_theme(agent: AutoNovelAgent) -> None:
    """Stories need a non-empty theme."""

    with pytest.raises(ValueError):
        agent.generate_story("")


def test_generate_story_series_produces_multiple_stories(agent: AutoNovelAgent) -> None:
    """Series generation returns one entry per theme."""

    stories = agent.generate_story_series(["mystery", "space"], protagonist="Explorer")
    assert len(stories) == 2
    assert "Explorer" in stories[0]
    assert "mystery" in stories[0]
    assert "space" in stories[1]


def test_generate_game_idea_validates_inputs(agent: AutoNovelAgent) -> None:
    """Game idea generation validates theme and engine."""

    with pytest.raises(ValueError):
        agent.generate_game_idea("   ", "unity")

    with pytest.raises(ValueError, match="Unsupported engine"):
        agent.generate_game_idea("mystery", "cryengine")


def test_generate_code_snippet_unknown_language(agent: AutoNovelAgent) -> None:
    """Unsupported languages raise a descriptive error."""

    with pytest.raises(ValueError, match="Unsupported language"):
        agent.generate_code_snippet("do something", "ruby")


def test_proofread_paragraph_improves_sentences(agent: AutoNovelAgent) -> None:
    """Proofreading normalises spacing and punctuation."""

    polished = agent.proofread_paragraph("hello world this is bad")
    assert polished == "Hello world this is bad."


def test_validate_scopes_blocks_excessive_permissions(agent: AutoNovelAgent) -> None:
    """Scope validation enforces the least-privilege policy."""

    with pytest.raises(ValueError, match="Invalid scopes: admin"):
        agent.validate_scopes(["outline:read", "admin"])

    # Allowed scopes should not raise.
    agent.validate_scopes(["outline:read"])


def test_generate_coding_challenge_validates_difficulty(agent: AutoNovelAgent) -> None:
    """Coding challenge generation enforces difficulty options."""

    with pytest.raises(ValueError):
        agent.generate_coding_challenge("graphs", "legendary")

    prompt = agent.generate_coding_challenge("graphs", "hard")
    assert "[Hard]" in prompt
    assert "graphs" in prompt
