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
