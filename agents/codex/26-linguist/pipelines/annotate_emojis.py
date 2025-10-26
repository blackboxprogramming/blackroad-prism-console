"""Emoji annotation utilities for Codex-26."""

from __future__ import annotations

from typing import Dict

_EMOJI_LEXICON: Dict[str, str] = {
    "✅": "confirm",
    "⚠️": "caution",
    "❓": "ask",
    "🛠️": "build",
    "🧯": "stabilize",
    "📈": "growth",
    "🌟": "delight",
    "🚧": "in_progress",
    "🎨": "create",
    "🌀": "uncertainty",
    "🧭": "navigation",
    "🧼": "clean",
    "🫶": "care",
}


def annotate_emojis(text: str) -> Dict[str, str]:
    """Return a mapping of emoji characters to semantic tags found in ``text``."""
    mapping: Dict[str, str] = {}
    for char in text:
        if char in _EMOJI_LEXICON:
            mapping[char] = _EMOJI_LEXICON[char]
    return mapping


__all__ = ["annotate_emojis"]
