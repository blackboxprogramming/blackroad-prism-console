"""Utility functions for the BlackRoad Prism console."""

from __future__ import annotations

import re

# Match an optional sign and digits with an optional fractional part.
_NUMERIC_PREFIX = re.compile(r"^\s*([+-]?\d+(?:\.\d+)?)")


def parse_numeric_prefix(text: str) -> float:
    """Extract the leading decimal value from ``text``.

    Accepts an optional sign and fractional part, ignoring trailing
    characters. Returns ``1.0`` when no valid number is found.
    """
    match = _NUMERIC_PREFIX.match(text)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return 1.0
