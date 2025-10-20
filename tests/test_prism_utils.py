"""Unit tests for helper functions in ``prism_utils``."""

from prism_utils import parse_numeric_prefix


def test_parse_numeric_prefix_valid():
    """Assert the parser returns the numeric part for valid prefixes."""
    assert parse_numeric_prefix("2, rest") == 2.0
    assert parse_numeric_prefix("3.5") == 3.5


def test_parse_numeric_prefix_invalid():
    """Assert the parser falls back to ``1.0`` for invalid prefixes."""
    assert parse_numeric_prefix("abc") == 1.0
    assert parse_numeric_prefix("1a") == 1.0
