"""Stencil generation utilities."""
from __future__ import annotations

from typing import Dict, List


def generate(paste_layers: List[Dict[str, object]]) -> List[Dict[str, object]]:
    """Transform paste layer metadata into stencil cut instructions."""

    stencils: List[Dict[str, object]] = []
    for layer in paste_layers:
        apertures = layer.get("apertures", [])
        if not apertures:
            continue
        total_area = sum(float(ap["width"]) * float(ap["height"]) for ap in apertures)
        stencils.append(
            {
                "name": layer.get("name", "paste"),
                "thickness_mm": float(layer.get("thickness_mm", 0.12)),
                "aperture_count": len(apertures),
                "total_aperture_area_mm2": total_area,
            }
        )
    return stencils


__all__ = ["generate"]
