from __future__ import annotations

RANDOM_SEED = 1337
RANDOM_SEED = 1234
STRICT_DQ = False

import os
from typing import List

# Global application settings with environment overrides.

MAX_ARTIFACT_MB: int = int(os.getenv("MAX_ARTIFACT_MB", "5"))
FORBIDDEN_BOTS: List[str] = [b for b in os.getenv("FORBIDDEN_BOTS", "").split(",") if b]
FORBIDDEN_INTENTS: List[str] = [i for i in os.getenv("FORBIDDEN_INTENTS", "").split(",") if i]
DRY_RUN: bool = os.getenv("DRY_RUN", "false").lower() in {"1", "true", "yes"}
from pathlib import Path

import yaml

RANDOM_SEED = 1337

_cfg_path = Path(__file__).resolve().parent / "config" / "safety.yaml"
try:
    _cfg = yaml.safe_load(_cfg_path.read_text(encoding="utf-8"))
except FileNotFoundError:
    _cfg = {}

PACKS_ENABLED = _cfg.get("packs_enabled", ["baseline"])
DUTY_OF_CARE = _cfg.get("duty_of_care", False)
THRESHOLDS = _cfg.get("thresholds", {})
