"""Unit conversion utilities for the meteoroid environment module."""

AU_IN_M = 149597870700.0  # meters

def au_to_m(au: float) -> float:
    """Convert astronomical units to meters."""
    return au * AU_IN_M
