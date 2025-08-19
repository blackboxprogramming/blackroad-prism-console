"""Public façade for the meteoroid environment module."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

import numpy as np
from numpy.typing import NDArray

from .kernels import encounter_velocities_kernel, number_density_kernel

__all__ = [
    "OrbitalElements",
    "TargetPoint",
    "number_density",
    "encounter_velocities",
]


@dataclass
class OrbitalElements:
    """Elliptic orbital elements."""

    a: float  # semi-major axis [m]
    e: float  # eccentricity [0..1)
    i: float  # inclination [rad]


@dataclass
class TargetPoint:
    """Cartesian heliocentric position."""

    x: float
    y: float
    z: float


def number_density(elements: OrbitalElements, point: TargetPoint) -> float:
    """Return meteoroid number density at ``point`` [1/m^3]."""

    r_vec = np.array([point.x, point.y, point.z], dtype=float)
    return float(number_density_kernel(r_vec))


def encounter_velocities(
    elements: OrbitalElements, point: TargetPoint
) -> NDArray[np.float64]:
    """Return encounter velocity vectors for the given configuration.

    The result may contain from zero to four vectors depending on whether the
    geometry admits valid solutions.  Each row is one 3D velocity in [m/s].
    """

    r_vec = np.array([point.x, point.y, point.z], dtype=float)
    return encounter_velocities_kernel(elements.a, elements.e, elements.i, r_vec)
