"""Unit tests for the normalize pipeline."""

from __future__ import annotations

from agents.codex._26_linguist.pipelines.normalize import normalize


def test_normalize_collapses_whitespace_and_capitalizes() -> None:
    result = normalize("   hello   world  ")
    assert result["text"] == "Hello world."
    assert not result["clarifier_needed"]


def test_normalize_flags_ambiguity() -> None:
    result = normalize("Maybe fix it")
    assert result["clarifier_needed"] is True
