"""Minimal meteoroid environment module.

This package provides simple, fully offline estimators for meteoroid number
density and encounter velocities in heliocentric space.  It is intentionally
small and self-contained so it can be embedded within agents without pulling
in large external dependencies or network resources.
"""
from .api import OrbitalElements, TargetPoint, encounter_velocities, number_density

__all__ = [
    "OrbitalElements",
    "TargetPoint",
    "number_density",
    "encounter_velocities",
]
