from dataclasses import dataclass
from typing import List, Dict, Any
from pathlib import Path
import yaml

from . import catalog

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "configs" / "sales" / "guardrails.yaml"


@dataclass
class Violation:
    code: str
    detail: str


def load_rules(path: Path = CONFIG) -> Dict[str, Any]:
    if path.exists():
        return yaml.safe_load(path.read_text())
    return {"max_discount_pct": 0, "floor_prices": {}}


def check(quote: Dict[str, Any], rules: Dict[str, Any] | None = None) -> List[Violation]:
    rules = rules or load_rules()
    catalog_data = catalog.load_artifact()
    base_lookup = {p["sku"]: p["base_price"] for p in catalog_data.get("pricebook", [])}
    violations: List[Violation] = []
    max_disc = rules.get("max_discount_pct", 0)
    floors = rules.get("floor_prices", {})
    for line in quote.get("lines", []):
        sku = line["sku"]
        unit = line["unit_price"]
        base = base_lookup.get(sku, unit)
        disc_pct = (1 - unit / base) * 100 if base else 0
        if disc_pct > max_disc:
            violations.append(Violation("DISC_OVER_MAX", sku))
        if unit < floors.get(sku, 0):
            violations.append(Violation("BELOW_FLOOR", sku))
        if line.get("options", {}).get("bundle_conflict"):
            violations.append(Violation("BUNDLE_CONFLICT", sku))
    return violations
