import ast

import pytest

from prism_utils import parse_numeric_prefix


def test_parse_numeric_prefix_valid():
    assert parse_numeric_prefix("2, rest") == 2.0
    assert parse_numeric_prefix("3.5") == 3.5


def test_parse_numeric_prefix_invalid():
    assert parse_numeric_prefix("abc") == 1.0
    assert parse_numeric_prefix("1a") == 1.0


@pytest.mark.parametrize("exc", [RecursionError, MemoryError])
def test_parse_numeric_prefix_other_errors(monkeypatch, exc):
    def bad_eval(_):
        raise exc()

    monkeypatch.setattr(ast, "literal_eval", bad_eval)
    assert parse_numeric_prefix("2") == 1.0
