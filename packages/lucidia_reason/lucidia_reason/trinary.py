"""Trinary logic core for Program-of-Thought reasoning."""
from __future__ import annotations
from enum import Enum


class TruthValue(Enum):
    """Trinary truth values."""
    TRUE = 1
    UNKNOWN = 0
    FALSE = -1

    def __str__(self) -> str:  # pragma: no cover - trivial
        mapping = {1: "true", 0: "unknown", -1: "false"}
        return mapping[self.value]


def neg(value: TruthValue) -> TruthValue:
    """Negate a trinary value."""
    return TruthValue(-value.value)


def and3(a: TruthValue, b: TruthValue) -> TruthValue:
    """Trinary AND."""
    if TruthValue.FALSE in (a, b):
        return TruthValue.FALSE
    if TruthValue.UNKNOWN in (a, b):
        return TruthValue.UNKNOWN
    return TruthValue.TRUE


def or3(a: TruthValue, b: TruthValue) -> TruthValue:
    """Trinary OR."""
    if TruthValue.TRUE in (a, b):
        return TruthValue.TRUE
    if TruthValue.UNKNOWN in (a, b):
        return TruthValue.UNKNOWN
    return TruthValue.FALSE


def imp3(a: TruthValue, b: TruthValue) -> TruthValue:
    """Trinary implication (a → b)."""
    return or3(neg(a), b)


def conflict(a: TruthValue, b: TruthValue) -> TruthValue:
    """Return FALSE when values conflict, TRUE otherwise."""
    return TruthValue.FALSE if a != b else TruthValue.TRUE
