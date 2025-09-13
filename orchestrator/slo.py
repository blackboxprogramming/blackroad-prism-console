from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict

import yaml  # type: ignore[import-untyped]


@dataclass
class SLO:
    name: str
    p50_ms: int
    p95_ms: int
    max_mem_mb: int


_DEFAULTS: Dict[str, SLO] = {
    "Treasury-BOT": SLO("Treasury-BOT", p50_ms=100, p95_ms=200, max_mem_mb=256),
    "RevOps-BOT": SLO("RevOps-BOT", p50_ms=120, p95_ms=250, max_mem_mb=256),
    "SRE-BOT": SLO("SRE-BOT", p50_ms=100, p95_ms=200, max_mem_mb=256),
}


def _load_overrides() -> Dict[str, SLO]:
    path = Path("config/slo.yaml")
    catalog = dict(_DEFAULTS)
    if path.exists():
        data = yaml.safe_load(path.read_text()) or {}
        for name, cfg in data.items():
            catalog[name] = SLO(name=name, **cfg)
    return catalog


SLO_CATALOG: Dict[str, SLO] = _load_overrides()
