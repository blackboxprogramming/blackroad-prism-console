"""Utility functions for the BlackRoad Prism console."""

from __future__ import annotations

import ast


def parse_numeric_prefix(text: str) -> float:
    """Return the leading numeric value in ``text`` or ``1.0`` if not found.

    This uses :func:`ast.literal_eval` for safety instead of ``eval`` and
    accepts inputs like ``"2, something"``. Literal boolean values such as
    ``"True"`` or ``"False"`` are treated as non-numeric, and only
    ``ValueError`` or ``SyntaxError`` are suppressed—these yield a default
    return of ``1.0``.
    """
    try:
        value = ast.literal_eval(text.split(",", maxsplit=1)[0].strip())
        if isinstance(value, bool):
            return 1.0
        if isinstance(value, (int, float)):
            return float(value)
    except (ValueError, SyntaxError):
        pass
    return 1.0
