"""Utility functions for the BlackRoad Prism console."""

from __future__ import annotations

import ast


def parse_numeric_prefix(text: str) -> float:
    """Return the leading numeric value in the text or 1.0 if none exists.

    The prefix is parsed with ast.literal_eval for safety and accepts inputs
    such as "2, something". Non-numeric or invalid values fall back to 1.0.
    """
    try:
        value = ast.literal_eval(text.split(",", maxsplit=1)[0].strip())
        if isinstance(value, (int, float)):
            return float(value)
    except Exception:
        pass
    return 1.0
