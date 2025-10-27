"""Linear adapter for Codex-34."""
from __future__ import annotations

from pathlib import Path

from .base import FileBackedAdapter


def get_adapter() -> FileBackedAdapter:
    """Return a configured adapter for Linear events."""

    mapping = Path(__file__).resolve().parent.parent / "mappers" / "linear_to_bus.json"
    return FileBackedAdapter(source="linear", mapping_file=mapping)
