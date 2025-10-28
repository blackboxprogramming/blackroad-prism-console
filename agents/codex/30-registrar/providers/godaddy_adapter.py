"""GoDaddy DNS provider adapter for Codex-30 Registrar."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, Iterable

from ..pipelines.zone_sync import ZoneDiff, apply_diff, diff_zone


class GoDaddyAdapter:
    """File-first adapter that works against exported GoDaddy zone JSON."""

    def __init__(self, export_path: Path) -> None:
        self.export_path = export_path

    def load(self) -> Dict[str, any]:
        return _read_json(self.export_path)

    def save(self, zone: Dict[str, any]) -> None:
        self.export_path.write_text(_to_json(zone), encoding="utf-8")

    def plan(self, desired: Dict[str, any]) -> Iterable[ZoneDiff]:
        current = self.load()
        return diff_zone(current, desired)

    def apply(self, diffs: Iterable[ZoneDiff]) -> Dict[str, any]:
        current = self.load()
        updated = apply_diff(current, list(diffs))
        self.save(updated)
        return updated


def _read_json(path: Path) -> Dict[str, any]:
    import json

    if not path.exists():
        return {"domain": "", "records": []}
    return json.loads(path.read_text(encoding="utf-8"))


def _to_json(payload: Dict[str, any]) -> str:
    import json

    return json.dumps(payload, indent=2, sort_keys=True)


__all__ = ["GoDaddyAdapter"]
