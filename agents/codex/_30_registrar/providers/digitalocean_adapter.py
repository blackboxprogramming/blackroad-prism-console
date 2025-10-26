"""DigitalOcean adapter that produces patch previews."""

from __future__ import annotations

from typing import Dict, List

from ..pipelines.zone_sync import Zone, diff_zone


class DigitalOceanAdapter:
    """Track desired changes before committing them."""

    def __init__(self) -> None:
        self._snapshot: Zone = {}
        self._pending: List[Dict[str, object]] = []

    def export_zone(self) -> Zone:
        return {name: list(records) for name, records in self._snapshot.items()}

    def stage(self, desired: Zone) -> List[Dict[str, object]]:
        self._pending = diff_zone(self.export_zone(), desired)
        return self._pending

    def commit(self) -> List[Dict[str, object]]:
        if not self._pending:
            return []
        for change in self._pending:
            action = change.get("action")
            name = change.get("name")
            if action == "add":
                self._snapshot[name] = change.get("records", [])
            elif action == "remove":
                self._snapshot.pop(name, None)
            elif action == "change":
                records = self._snapshot.get(name, [])
                if records:
                    records = [change.get("to", {})]
                else:
                    records = [change.get("to", {})]
                self._snapshot[name] = records
        applied = list(self._pending)
        self._pending = []
        return applied
