"""Utility functions for the BlackRoad Prism console."""

from __future__ import annotations

import ast


def parse_numeric_prefix(text: str) -> float:
    """Return the leading numeric value in ``text`` or ``1.0`` if parsing fails.

    The prefix may include negatives or decimals. The function uses
    :func:`ast.literal_eval` for safety instead of ``eval`` and evaluates the
    substring before the first comma. Only ``ValueError`` and ``SyntaxError``
    are suppressed—covering empty strings, whitespace, non-numeric tokens, or
    malformed expressions—and the default ``1.0`` is returned in those cases.
    """
    try:
        value = ast.literal_eval(text.split(",", maxsplit=1)[0].strip())
        if isinstance(value, (int, float)):
            return float(value)
    except (ValueError, SyntaxError):
        pass
    return 1.0
