"""Cloudflare DNS adapter for Codex-30 Registrar."""
from __future__ import annotations

import json
from typing import Dict, Iterable

from ..pipelines.zone_sync import ZoneDiff, apply_diff, diff_zone


class CloudflareAdapter:
    """Adapter that operates on Cloudflare API-compatible JSON dumps."""

    def __init__(self, snapshot: Dict[str, any] | None = None) -> None:
        self.snapshot = snapshot or {"domain": "", "records": []}

    def load(self) -> Dict[str, any]:
        return json.loads(json.dumps(self.snapshot))

    def plan(self, desired: Dict[str, any]) -> Iterable[ZoneDiff]:
        current = self.load()
        return diff_zone(current, desired)

    def apply(self, diffs: Iterable[ZoneDiff]) -> Dict[str, any]:
        current = self.load()
        updated = apply_diff(current, list(diffs))
        self.snapshot = updated
        return updated


__all__ = ["CloudflareAdapter"]
