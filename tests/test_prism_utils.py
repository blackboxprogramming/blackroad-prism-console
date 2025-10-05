"""Tests for :mod:`prism_utils`."""

import pytest

from prism_utils import parse_numeric_prefix


@pytest.mark.parametrize(
    "text, expected",
    [
        ("2, rest", 2.0),
        ("3.5", 3.5),
        ("-4, things", -4.0),
        ("-0.5", -0.5),
    ],
)
def test_parse_numeric_prefix_valid(text: str, expected: float) -> None:
    """Return parsed value for valid numeric prefixes."""
    assert parse_numeric_prefix(text) == expected


@pytest.mark.parametrize(
    "text",
    [
        pytest.param("", id="empty"),
        pytest.param("   ", id="whitespace"),
        pytest.param("abc", id="non-numeric"),
        pytest.param("1a", id="mixed"),
        pytest.param("(", id="syntax-error"),
    ],
)
def test_parse_numeric_prefix_invalid(text: str) -> None:
    """Fall back to ``1.0`` when parsing fails."""
    assert parse_numeric_prefix(text) == 1.0
