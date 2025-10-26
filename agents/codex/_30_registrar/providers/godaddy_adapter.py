"""File-first GoDaddy adapter used by the registrar."""

from __future__ import annotations

from typing import Dict, List

from ..pipelines.zone_sync import Zone, diff_zone


class GoDaddyAdapter:
    """Minimal adapter that tracks an in-memory zone export."""

    def __init__(self, snapshot: Zone | None = None) -> None:
        self._snapshot: Zone = snapshot or {}

    def export_zone(self) -> Zone:
        """Return the cached zone snapshot."""

        return {name: list(records) for name, records in self._snapshot.items()}

    def import_zone(self, desired: Zone) -> List[Dict[str, object]]:
        """Apply the desired zone if the diff looks safe."""

        current = self.export_zone()
        diffs = diff_zone(current, desired)
        if diffs:
            self._snapshot = {name: list(records) for name, records in desired.items()}
        return diffs
