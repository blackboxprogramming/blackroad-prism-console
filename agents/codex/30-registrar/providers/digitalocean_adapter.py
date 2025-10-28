"""DigitalOcean DNS adapter for Codex-30 Registrar."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Iterable

from ..pipelines.zone_sync import ZoneDiff, apply_diff, diff_zone


class DigitalOceanAdapter:
    """DigitalOcean DNS adapter that reads and writes JSON zone specs."""

    def __init__(self, path: Path) -> None:
        self.path = path

    def load(self) -> Dict[str, any]:
        if not self.path.exists():
            return {"domain": "", "records": []}
        return json.loads(self.path.read_text(encoding="utf-8"))

    def plan(self, desired: Dict[str, any]) -> Iterable[ZoneDiff]:
        current = self.load()
        return diff_zone(current, desired)

    def apply(self, diffs: Iterable[ZoneDiff]) -> Dict[str, any]:
        current = self.load()
        updated = apply_diff(current, list(diffs))
        self.path.write_text(json.dumps(updated, indent=2, sort_keys=True), encoding="utf-8")
        return updated


__all__ = ["DigitalOceanAdapter"]
