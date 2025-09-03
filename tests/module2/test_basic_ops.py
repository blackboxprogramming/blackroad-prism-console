"""Tests for Lucidia Module 2 basic math utilities."""

from lucidia.modules.module2.basic_ops import add, multiply


def test_add() -> None:
    assert add(2, 3) == 5
    assert add(-1, 1.5) == 0.5


def test_multiply() -> None:
    assert multiply(2, 3) == 6
    assert multiply(-2, 4) == -8
