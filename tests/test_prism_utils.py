import pytest

from prism_utils import parse_numeric_prefix


@pytest.mark.parametrize(
    "text, expected",
    [
        ("2, rest", 2.0),
        ("3.5", 3.5),
        ("-4, things", -4.0),
    ],
)
def test_parse_numeric_prefix_valid(text, expected):
    assert parse_numeric_prefix(text) == expected


@pytest.mark.parametrize("text", ["abc", "1a", "("])
def test_parse_numeric_prefix_invalid(text):
    assert parse_numeric_prefix(text) == 1.0
