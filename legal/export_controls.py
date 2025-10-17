from __future__ import annotations

import json
from pathlib import Path
from typing import List

import yaml
from tools import storage

ROOT = Path(__file__).resolve().parents[1]
CONF_DIR = ROOT / "configs" / "legal" / "export"


RULES = yaml.safe_load((CONF_DIR / "rules.yaml").read_text())


def screen(partner: str, order_path: str) -> List[str]:
    violations: List[str] = []
    data = json.loads(Path(order_path).read_text())
    restricted_regions = set(RULES.get("restricted_regions", []))
    restricted_entities = set(RULES.get("restricted_entities", []))
    sku_rules = RULES.get("sku_rules", {})
    if partner in restricted_entities:
        violations.append("EXP_ENTITY_MATCH")
    for line in data:
        region = line.get("region")
        sku = line.get("sku")
        if region in restricted_regions:
            violations.append("EXP_REGION_BLOCK")
        rule = sku_rules.get(sku, {})
        rregs = set(rule.get("restricted_regions", []))
        if region in rregs:
            violations.append("EXP_LICENSE_REQUIRED")
    return violations
