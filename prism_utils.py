"""Utility functions for the BlackRoad Prism console."""

from __future__ import annotations

import re

# Regex for a decimal number, allowing leading whitespace, optional sign and fraction.
_NUMERIC_PREFIX = re.compile(r"^\s*([+-]?\d+(?:\.\d+)?)")


def parse_numeric_prefix(text: str) -> float:
    """Extracts the leading decimal value from ``text``.

    Allows leading whitespace, an optional sign, and an optional fractional
    part, ignoring trailing characters. Returns ``1.0`` when no valid number is
    found.
    """
    match = _NUMERIC_PREFIX.match(text)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return 1.0
