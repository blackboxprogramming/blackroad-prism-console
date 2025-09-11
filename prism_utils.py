"""Utility functions for the BlackRoad Prism console."""

from __future__ import annotations

import ast


def parse_numeric_prefix(text: str) -> float:
    """Extract the numeric prefix from ``text``.

    The first comma-separated token is safely evaluated with
    :func:`ast.literal_eval`. If that token is missing or not numeric the
    function returns ``1.0``.
    """
    try:
        value = ast.literal_eval(text.split(",", maxsplit=1)[0].strip())
        if isinstance(value, (int, float)):
            return float(value)
    except (ValueError, SyntaxError, MemoryError, RecursionError):
        # Non-numeric, malformed, or pathological prefixes fall through to the
        # default below.
        pass
    return 1.0
