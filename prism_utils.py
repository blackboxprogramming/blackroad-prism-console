"""Utility functions for the BlackRoad Prism console."""

from __future__ import annotations

import re

# Precompiled regex to extract a leading decimal number with optional sign.
_NUMERIC_PREFIX = re.compile(r"^\s*([+-]?\d+(?:\.\d+)?)")


def parse_numeric_prefix(text: str) -> float:
    """Return the leading decimal value in ``text`` or ``1.0`` if absent.

    Only simple base-10 numbers are supported to avoid evaluating arbitrary
    Python expressions. Inputs like ``"2, something"`` are accepted. Non-numeric
    or invalid values default to ``1.0``.
    """
    match = _NUMERIC_PREFIX.match(text)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return 1.0
