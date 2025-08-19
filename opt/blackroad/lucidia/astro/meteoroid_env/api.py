"""Simple meteoroid environment computation utilities.

This module is a lightweight placeholder to support the offline
API used in tests. The physics is not intended to be accurate.
"""
from dataclasses import dataclass
import numpy as np


@dataclass
class OrbitalElements:
    a: float  # semi-major axis in meters
    e: float  # eccentricity
    i: float  # inclination in radians


@dataclass
class TargetPoint:
    x: float
    y: float
    z: float


def number_density(elems: OrbitalElements, tp: TargetPoint) -> float:
    """Return a toy number density in 1/m^3.

    The model simply scales inversely with distance from the origin and
    semi-major axis to provide deterministic, non-zero values.
    """
    r = np.sqrt(tp.x ** 2 + tp.y ** 2 + tp.z ** 2) + 1e-9
    return 1e-6 * (1.0 + elems.e) / (r * (elems.a / 1e11))


def encounter_velocities(elems: OrbitalElements, tp: TargetPoint) -> np.ndarray:
    """Return a set of encounter velocity vectors in m/s.

    For demonstration we return a single branch pointing from the origin
    to the target point with a magnitude of 1 km/s.
    """
    vec = np.array([tp.x, tp.y, tp.z], dtype=float)
    norm = np.linalg.norm(vec)
    if norm == 0:
        vec = np.array([1.0, 0.0, 0.0])
    else:
        vec = vec / norm
    return vec[np.newaxis, :] * 1000.0  # 1 km/s
