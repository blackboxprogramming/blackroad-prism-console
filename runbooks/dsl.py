from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

import yaml

from tools import storage


@dataclass
class Step:
    action: str
    params: Dict[str, Any]


@dataclass
class Runbook:
    name: str
    steps: List[Step]


def load(path: str) -> Runbook:
    data = yaml.safe_load(storage.read(path))
    steps = [Step(**s) for s in data.get("steps", [])]
    return Runbook(name=data["name"], steps=steps)
