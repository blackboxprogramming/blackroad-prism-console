"""Utility functions for the BlackRoad Prism console."""

from __future__ import annotations

import re

# Match an optional sign and decimal number at the start of the string.
#
# The pattern also accepts numbers like ``.5`` or ``-.25`` that omit the
# leading ``0`` before the decimal point.
_NUMERIC_PREFIX = re.compile(r"^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))")


def parse_numeric_prefix(text: str) -> float:
    """Extract a leading decimal value from ``text``.

    The regex ignores leading whitespace and accepts an optional ``+`` or ``-``
    sign and an optional fractional part. Numbers lacking a leading zero, such
    as ``".5 kg"`` or ``"-.25"``, are also recognized. If no valid number is
    found, ``1.0`` is returned. Inputs such as ``"-3.5 apples"`` or ``"2, rest"``
    are recognized; malformed values default to ``1.0``.
    """
    match = _NUMERIC_PREFIX.match(text)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
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
