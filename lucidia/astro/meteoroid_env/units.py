"""Unit conversion helpers for the meteoroid environment module.

All calculations internally use SI units (meters, seconds). The helpers
here provide convenience conversions to and from astronomical units (au)
and kilometres per second (km/s).
"""
from __future__ import annotations

__all__ = ["AU", "au_to_m", "m_to_au", "kms_to_ms", "ms_to_kms"]

AU: float = 149_597_870_700.0  # [m]


def au_to_m(au: float) -> float:
    """Convert astronomical units to meters."""
    return au * AU


def m_to_au(meters: float) -> float:
    """Convert meters to astronomical units."""
    return meters / AU


def kms_to_ms(km_per_s: float) -> float:
    """Convert kilometres per second to meters per second."""
    return km_per_s * 1_000.0


def ms_to_kms(m_per_s: float) -> float:
    """Convert meters per second to kilometres per second."""
    return m_per_s / 1_000.0
