from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

import yaml

CONFIG_ROOT = Path(__file__).resolve().parents[1] / "configs" / "redteam"


def list_scenarios() -> List[str]:
    return [p.stem for p in CONFIG_ROOT.glob("*.yaml")]


def load_scenario(name: str) -> Dict[str, Any]:
    path = CONFIG_ROOT / f"{name}.yaml"
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)
