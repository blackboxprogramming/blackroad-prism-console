from dataclasses import dataclass
from pathlib import Path
from typing import Dict

import yaml


@dataclass
class SLO:
    name: str
    p50_ms: int
    p95_ms: int
    max_mem_mb: int


def _load_catalog() -> Dict[str, SLO]:
    defaults = {
        "Treasury-BOT": SLO("Treasury-BOT", 50, 100, 200),
        "RevOps-BOT": SLO("RevOps-BOT", 50, 100, 200),
        "SRE-BOT": SLO("SRE-BOT", 50, 100, 200),
    }
    cfg = Path("config/slo.yaml")
    if cfg.exists():
        data = yaml.safe_load(cfg.read_text()) or {}
        for name, vals in data.items():
            defaults[name] = SLO(name, **vals)
    return defaults


SLO_CATALOG: Dict[str, SLO] = _load_catalog()
