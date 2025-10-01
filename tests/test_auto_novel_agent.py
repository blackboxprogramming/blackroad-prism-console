"""Tests for the :mod:`agents.auto_novel_agent` module."""

from agents.auto_novel_agent import AutoNovelAgent


def test_generate_storyline_returns_expected_sentence() -> None:
    """AutoNovelAgent should build a deterministic storyline."""
    agent = AutoNovelAgent()

    storyline = agent.generate_storyline("Ada", "a digital forest")

    assert (
        storyline
        == "Ada embarks on an adventure in a digital forest, "
        "discovering the true meaning of courage."
    )


def test_list_supported_engines_sorted() -> None:
    """The supported engines list should be sorted alphabetically."""
    agent = AutoNovelAgent()

    assert agent.list_supported_engines() == ["unity", "unreal"]
