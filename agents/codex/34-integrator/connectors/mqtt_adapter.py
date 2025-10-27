"""MQTT adapter for Codex-34."""
from __future__ import annotations

from pathlib import Path

from .base import FileBackedAdapter


def get_adapter() -> FileBackedAdapter:
    """Return a configured adapter for MQTT messages."""

    mapping = Path(__file__).resolve().parent.parent / "mappers" / "mqtt_to_bus.json"
    return FileBackedAdapter(source="mqtt", mapping_file=mapping)
