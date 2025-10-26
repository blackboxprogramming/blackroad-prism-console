"""Cloudflare adapter with TTL normalisation."""

from __future__ import annotations

from typing import Dict, List

from ..pipelines.zone_sync import Zone, diff_zone


class CloudflareAdapter:
    """Ensure desired TTLs respect registrar defaults before applying."""

    def __init__(self, default_ttl: int = 300) -> None:
        self._default_ttl = default_ttl
        self._snapshot: Zone = {}

    def export_zone(self) -> Zone:
        return {name: list(records) for name, records in self._snapshot.items()}

    def import_zone(self, desired: Zone) -> List[Dict[str, object]]:
        normalised = {
            name: [self._ensure_ttl(record) for record in records]
            for name, records in desired.items()
        }
        diffs = diff_zone(self.export_zone(), normalised)
        if diffs:
            self._snapshot = normalised
        return diffs

    def _ensure_ttl(self, record: Dict[str, object]) -> Dict[str, object]:
        ttl = record.get("ttl", self._default_ttl)
        updated = dict(record)
        updated["ttl"] = max(int(ttl), self._default_ttl)
        return updated
