"""Wire harness planning helpers."""
from __future__ import annotations

from typing import Dict, Iterable, List


COLOR_SEQUENCE = ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet"]


def generate(routes: Iterable[Dict[str, object]]) -> List[Dict[str, object]]:
    """Create harness entries with colour labels and cut lengths."""

    harness: List[Dict[str, object]] = []
    for idx, route in enumerate(routes):
        length = float(route.get("length_mm", 0))
        if length <= 0:
            continue
        harness.append(
            {
                "signal": route.get("signal", f"net_{idx}"),
                "from": route.get("from", ""),
                "to": route.get("to", ""),
                "length_mm": length,
                "color": COLOR_SEQUENCE[idx % len(COLOR_SEQUENCE)],
                "label": route.get("label", route.get("signal", f"net_{idx}")),
            }
        )
    return harness


__all__ = ["generate"]
