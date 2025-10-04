"""Sanity checks for the reusable metric helpers."""

from __future__ import annotations

import math

import pytest

from universal_sim.metrics import (
    max_error,
    mean_absolute_error,
    pass_rate,
    root_mean_square_error,
)


def test_mean_absolute_error_basic() -> None:
    actual = [1.0, 2.0, 3.0]
    predicted = [0.5, 2.5, 2.0]
    assert mean_absolute_error(actual, predicted) == pytest.approx(0.6666667)


def test_root_mean_square_error_basic() -> None:
    actual = [5.0, 7.0, 9.0]
    predicted = [4.5, 7.5, 8.0]
    assert root_mean_square_error(actual, predicted) == pytest.approx(math.sqrt(0.5))


def test_max_error_handles_empty() -> None:
    assert max_error([], []) == 0.0


def test_pass_rate_fraction() -> None:
    values = [0.1, -0.2, 0.8, -1.2]
    assert pass_rate(values, 0.75) == pytest.approx(0.5)


def test_metrics_length_mismatch() -> None:
    with pytest.raises(ValueError):
        mean_absolute_error([1.0, 2.0], [1.0])
