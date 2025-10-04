"""Reusable metric helpers for the simulation starter pipeline."""

from __future__ import annotations

import math
from typing import Iterable, Sequence


NumberSequence = Sequence[float]


def _validate_lengths(actual: Sequence[float], predicted: Sequence[float]) -> None:
    if len(actual) != len(predicted):
        raise ValueError("actual and predicted must contain the same number of elements")


def mean_absolute_error(actual: NumberSequence, predicted: NumberSequence) -> float:
    """Compute the mean absolute error between *actual* and *predicted* sequences."""

    _validate_lengths(actual, predicted)
    if not actual:
        return 0.0
    total = sum(abs(a - b) for a, b in zip(actual, predicted))
    return total / len(actual)


def root_mean_square_error(actual: NumberSequence, predicted: NumberSequence) -> float:
    """Compute the root mean square error for the supplied sequences."""

    _validate_lengths(actual, predicted)
    if not actual:
        return 0.0
    squared_error = sum((a - b) ** 2 for a, b in zip(actual, predicted))
    return math.sqrt(squared_error / len(actual))


def max_error(actual: NumberSequence, predicted: NumberSequence) -> float:
    """Return the maximum absolute error observed between the sequences."""

    _validate_lengths(actual, predicted)
    if not actual:
        return 0.0
    return max(abs(a - b) for a, b in zip(actual, predicted))


def pass_rate(values: Iterable[float], limit: float) -> float:
    """Return the share of values whose absolute magnitude is below ``limit``."""

    values = list(values)
    if not values:
        return 0.0
    passed = sum(1 for value in values if abs(value) <= limit)
    return passed / len(values)


__all__ = [
    "mean_absolute_error",
    "root_mean_square_error",
    "max_error",
    "pass_rate",
]
