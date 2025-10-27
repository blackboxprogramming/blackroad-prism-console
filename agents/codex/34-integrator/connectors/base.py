"""Base helpers for Codex-34 connectors."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

from ..pipelines.normalize_event import normalize


@dataclass
class FileBackedAdapter:
    """Adapter that reads its mapper definition from disk.

    The adapter produces normalized events by passing the incoming payload through the
    shared :func:`normalize` pipeline. Each adapter declares its ``source`` string and the
    relative mapping file used during normalization.
    """

    source: str
    mapping_file: Path

    def __post_init__(self) -> None:
        if not self.mapping_file.exists():
            raise FileNotFoundError(f"Mapper not found for {self.source}: {self.mapping_file}")

    def prepare_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Compose the raw event envelope expected by :func:`normalize`.

        Parameters
        ----------
        payload:
            Raw connector payload fetched from the upstream API/device.

        Returns
        -------
        dict
            Envelope with ``source`` and ``payload`` keys.
        """

        return {"source": self.source, "payload": payload}

    def normalize(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize a payload using the adapter's mapper configuration."""

        event = self.prepare_event(payload)
        event["mapper_override"] = self._load_mapping()
        return normalize(event)

    def _load_mapping(self) -> Dict[str, Any]:
        with self.mapping_file.open("r", encoding="utf-8") as handle:
            return json.load(handle)
