from __future__ import annotations
from dataclasses import dataclass
from typing import Callable, Dict, List
from pathlib import Path
import hashlib
from .utils import log_metric

ROOT = Path(__file__).resolve().parents[1]
IR_ARTIFACTS = ROOT / "artifacts" / "ir"

@dataclass
class KPI:
    id: str
    definition: str
    unit: str
    owner: str
    calc: Callable[[str], float]

REGISTRY: Dict[str, KPI] = {}

def register(kpi: KPI) -> None:
    REGISTRY[kpi.id] = kpi

def _base(period: str) -> int:
    return int(hashlib.sha256(period.encode()).hexdigest(), 16) % 1000

register(KPI("revenue", "Total revenue", "USD", "finance", lambda p: 1000 + _base(p)))
register(KPI("gm_pct", "Gross margin %", "%", "finance", lambda p: 50 + _base(p) / 100))
register(KPI("nrr", "Net revenue retention", "%", "finance", lambda p: 90 + _base(p) / 200))
register(KPI("churn_pct", "Customer churn %", "%", "ops", lambda p: 5 + _base(p) / 500))
register(KPI("wau_mau", "WAU/MAU", "%", "product", lambda p: 60 + _base(p) / 100))
register(KPI("uptime", "Service uptime", "%", "sre", lambda p: 99 + _base(p) / 1000))
register(KPI("mttr", "Mean time to resolve", "hrs", "sre", lambda p: 1 + _base(p) / 1000))
register(KPI("ccc", "Cash conversion cycle", "days", "finance", lambda p: 30 + _base(p) / 50))
register(KPI("inventory_turns", "Inventory turns", "x", "supply", lambda p: 10 + _base(p) / 100))
register(KPI("wau", "Weekly active users", "count", "product", lambda p: 10000 + _base(p)))
register(KPI("mau", "Monthly active users", "count", "product", lambda p: 40000 + _base(p) * 2))
register(KPI("nps", "Net promoter score", "score", "ops", lambda p: 20 + _base(p) / 50))


def compute(period: str) -> List[dict]:
    rows = []
    for kpi in REGISTRY.values():
        rows.append({"id": kpi.id, "value": round(kpi.calc(period), 2), "unit": kpi.unit})
    log_metric("ir_kpi_compute")
    return rows
