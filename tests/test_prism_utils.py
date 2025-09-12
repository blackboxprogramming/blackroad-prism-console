"""Test helper functions in `prism_utils`."""

from prism_utils import parse_numeric_prefix


def test_parse_numeric_prefix_valid():
    """Return numeric prefix for valid input."""
    assert parse_numeric_prefix("2, rest") == 2.0
    assert parse_numeric_prefix("3.5") == 3.5


def test_parse_numeric_prefix_invalid():
    """Return ``1.0`` when the prefix is invalid."""
    assert parse_numeric_prefix("abc") == 1.0
    assert parse_numeric_prefix("1a") == 1.0
