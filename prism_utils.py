"""Utility functions for the BlackRoad Prism console."""

from __future__ import annotations

import ast


def parse_numeric_prefix(text: str) -> float:
    """Return the leading numeric value in ``text`` or ``1.0`` if not found.

    This uses :func:`ast.literal_eval` for safety instead of ``eval`` and
    accepts inputs like ``"2, something"``. Non-numeric or invalid values
    would raise ``ValueError`` or ``SyntaxError``, but these are suppressed
    and result in a default return of ``1.0``.
    """
    try:
        value = ast.literal_eval(text.split(",", maxsplit=1)[0].strip())
        if isinstance(value, (int, float)):
            return float(value)
    except (ValueError, SyntaxError):
        pass
    return 1.0
