"""Serial (USB) adapter for Codex-34."""
from __future__ import annotations

from pathlib import Path

from .base import FileBackedAdapter


def get_adapter() -> FileBackedAdapter:
    """Return a configured adapter for serial frame events."""

    mapping = Path(__file__).resolve().parent.parent / "mappers" / "serial_to_bus.json"
    return FileBackedAdapter(source="serial", mapping_file=mapping)
