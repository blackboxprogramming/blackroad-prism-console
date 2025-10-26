"""Tests for dialect application."""

from __future__ import annotations

from agents.codex._26_linguist.pipelines.dialect_apply import apply_dialect


def test_apply_dialect_defaults_to_core() -> None:
    normalized = {"text": "We can't ship", "emoji_map": {}}
    result = apply_dialect(normalized, "nonexistent")
    assert result["dialect"] == "dialect-core"
    assert any(note.startswith("Tone set to") for note in result["notes"])


def test_apply_dialect_respects_audience() -> None:
    normalized = {"text": "We're ready.", "emoji_map": {}}
    result = apply_dialect(normalized, "engineer")
    assert result["dialect"] == "dialect-engineer"
    assert "We are" in result["text"]
