from __future__ import annotations
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

import yaml


@dataclass
class Rule:
    name: str
    source: str
    select: List[str]
    where: str
    severity: str
    tags: List[str]


def load_rules(directory: Path) -> List[Rule]:
    rules: List[Rule] = []
    for path in sorted(directory.glob("*.yaml")):
        with path.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        rules.append(Rule(**data))
    return rules
