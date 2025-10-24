"""Tests for :func:`prism_utils.parse_numeric_prefix`."""
"""Unit tests for helper functions in ``prism_utils``."""

from prism_utils import parse_numeric_prefix


def test_parse_numeric_prefix_valid():
    """It returns the numeric portion when the prefix is well formed."""

    """Assert the parser returns the numeric part for valid prefixes."""
    assert parse_numeric_prefix("2, rest") == 2.0
    assert parse_numeric_prefix("3.5") == 3.5
    assert parse_numeric_prefix("-1 stuff") == -1.0
    assert parse_numeric_prefix("+4") == 4.0
    assert parse_numeric_prefix(".5 pears") == 0.5
    assert parse_numeric_prefix("-.25") == -0.25


def test_parse_numeric_prefix_invalid():
    """It falls back to ``1.0`` for missing or malformed prefixes."""

    """Assert the parser falls back to ``1.0`` for invalid prefixes."""
    assert parse_numeric_prefix("abc") == 1.0
    assert parse_numeric_prefix("1a") == 1.0
    assert parse_numeric_prefix("") == 1.0
    assert parse_numeric_prefix("+a") == 1.0
