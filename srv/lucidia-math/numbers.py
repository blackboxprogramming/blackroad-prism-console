"""Invented number systems with operator overloading.

Three playful systems are provided just to illustrate the concept:
``FractalNumber`` storing a value and a fractal dimension, ``DimensionalNumber``
carrying a magnitude and unit, and ``WaveNumber`` composed of amplitude and
phase.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class FractalNumber:
    value: float
    dimension: float

    def __add__(self, other: "FractalNumber") -> "FractalNumber":
        return FractalNumber(self.value + other.value, max(self.dimension, other.dimension))

    def __mul__(self, other: "FractalNumber") -> "FractalNumber":
        return FractalNumber(self.value * other.value, self.dimension + other.dimension)


@dataclass
class DimensionalNumber:
    magnitude: float
    unit: str

    def __add__(self, other: "DimensionalNumber") -> "DimensionalNumber":
        if self.unit != other.unit:
            raise ValueError("unit mismatch")
        return DimensionalNumber(self.magnitude + other.magnitude, self.unit)

    def __mul__(self, other: "DimensionalNumber") -> "DimensionalNumber":
        return DimensionalNumber(self.magnitude * other.magnitude, f"{self.unit}*{other.unit}")


@dataclass
class WaveNumber:
    amplitude: float
    phase: float

    def __add__(self, other: "WaveNumber") -> "WaveNumber":
        return WaveNumber(self.amplitude + other.amplitude, self.phase)

    def __mul__(self, other: "WaveNumber") -> "WaveNumber":
        return WaveNumber(self.amplitude * other.amplitude, self.phase + other.phase)


__all__ = ["FractalNumber", "DimensionalNumber", "WaveNumber", "demo"]


def demo() -> tuple[FractalNumber, DimensionalNumber, WaveNumber]:
    """Return sample calculations in each invented system."""

    f = FractalNumber(1, 1.5) + FractalNumber(2, 2.0)
    d = DimensionalNumber(3, "m") * DimensionalNumber(2, "s")
    w = WaveNumber(1, 0) * WaveNumber(0.5, 1.0)
    return f, d, w
"""Number theory helpers."""
from math import factorial


def triangular(n: int) -> int:
    """Return the n-th triangular number."""
    return n * (n + 1) // 2


def factorial_demo(n: int) -> int:
    """Expose factorial for demos."""
    return factorial(n)
