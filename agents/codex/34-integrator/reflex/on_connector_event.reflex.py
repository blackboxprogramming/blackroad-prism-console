"""Reflex hook: raw connector event -> normalized bus event."""
from __future__ import annotations

from typing import Dict

from .bus import BUS
from ..pipelines.normalize_event import normalize
from ..pipelines.energy_meter import estimate


@BUS.on("connector:event")
def handle_connector_event(event: Dict[str, object]) -> None:
    normalized = normalize(dict(event))
    normalized["energy_j"] = estimate(normalized)
    BUS.emit("bus:normalized", normalized)
