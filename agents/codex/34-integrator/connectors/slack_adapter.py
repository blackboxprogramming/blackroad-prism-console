"""Slack adapter for Codex-34."""
from __future__ import annotations

from pathlib import Path

from .base import FileBackedAdapter


def get_adapter() -> FileBackedAdapter:
    """Return a configured adapter for Slack events."""

    mapping = Path(__file__).resolve().parent.parent / "mappers" / "slack_to_bus.json"
    return FileBackedAdapter(source="slack", mapping_file=mapping)
