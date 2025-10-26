"""Utilities to normalize inbound text for Codex-26."""

from __future__ import annotations

import re
from typing import Dict, Iterable, List

from .annotate_emojis import annotate_emojis


_AMBIGUITY_MARKERS: Iterable[str] = {
    "maybe",
    "someday",
    "somehow",
    "whatever",
    "stuff",
}


def _collapse_whitespace(text: str) -> str:
    """Return the text with whitespace collapsed and trimmed."""
    collapsed = re.sub(r"\s+", " ", text)
    return collapsed.strip()


def _collect_notes(text: str) -> List[str]:
    """Generate normalization notes for downstream components."""
    notes: List[str] = []
    if text and text[0].islower():
        notes.append("Capitalized leading token.")
    if text and not text.endswith(('.', '?', '!')):
        notes.append("Appended terminal period for stability.")
    return notes


def normalize(raw_text: str) -> Dict[str, object]:
    """Normalize raw inbound text into a canonical shape.

    The pipeline collapses whitespace, gently capitalizes the opening token,
    and annotates emoji semantics for downstream routing.
    """
    if not isinstance(raw_text, str):
        raise TypeError("raw_text must be a string")

    collapsed = _collapse_whitespace(raw_text)
    if collapsed:
        normalized = collapsed[0].upper() + collapsed[1:]
    else:
        normalized = ""
    notes = _collect_notes(collapsed)
    if normalized and normalized[-1] not in {'.', '?', '!'}:
        normalized = f"{normalized}."
    emoji_map = annotate_emojis(normalized)
    needs_clarifier = any(marker in normalized.lower() for marker in _AMBIGUITY_MARKERS)

    return {
        "text": normalized,
        "emoji_map": emoji_map,
        "clarifier_needed": needs_clarifier,
        "notes": notes,
    }


__all__ = ["normalize"]
