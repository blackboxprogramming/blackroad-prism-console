"""Utility functions for the BlackRoad Prism console."""

from __future__ import annotations

import re

# Matches a decimal number with optional leading whitespace, sign, and fractional part.
_NUMERIC_PREFIX = re.compile(r"^\s*([+-]?\d+(?:\.\d+)?)")


def parse_numeric_prefix(text: str) -> float:
    """Return the leading decimal value in ``text``.

    Allows leading whitespace, an optional sign, and fractional part while
    ignoring trailing characters. Returns ``1.0`` when no valid number is
    found.
    """
    match = _NUMERIC_PREFIX.match(text)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return 1.0
