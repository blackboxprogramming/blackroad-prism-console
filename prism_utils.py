"""Utility functions for the BlackRoad Prism console."""

from __future__ import annotations

import ast
import re

_NUMERIC_PREFIX_RE = re.compile(r"^\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)")


def parse_numeric_prefix(text: str) -> float:
    """Return the leading numeric value in ``text`` or ``1.0`` if not found.

    The function extracts an optional sign and numeric token—supporting
    integers, decimals, and scientific notation—at the start of ``text`` using
    a regular expression. The extracted token is parsed with
    :func:`ast.literal_eval` for safety. If the token cannot be parsed or is
    absent, ``1.0`` is returned.
    """
    match = _NUMERIC_PREFIX_RE.match(text)
    if not match:
        return 1.0
    try:
        value = ast.literal_eval(match.group(1))
    except Exception:
        return 1.0
    return float(value) if isinstance(value, (int, float)) else 1.0
