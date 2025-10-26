"""Clarification utilities for Codex-26."""

from __future__ import annotations

from typing import Iterable

_AMBIGUOUS_VERBS: Iterable[str] = {
    "handle",
    "fix",
    "do",
    "make",
    "change",
}


def clarify(context: str) -> str:
    """Return a single kind clarifying question for the ``context``."""
    lowered = context.lower()
    for verb in _AMBIGUOUS_VERBS:
        if verb in lowered:
            return f"Could you share what you mean by '{verb}' so I can aim correctly?"
    return "Could you share the result you need so I can aim correctly?"


__all__ = ["clarify"]
