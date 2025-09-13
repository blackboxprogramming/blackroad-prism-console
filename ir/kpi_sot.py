from __future__ import annotations
from dataclasses import dataclass
from typing import Callable, Dict, List
from pathlib import Path
import json

from .utils import IR_ARTIFACTS, log_metric

@dataclass
class KPI:
    id: str
    definition: str
    unit: str
    owner: str
    calc: Callable[[str], float]

_registry: Dict[str, KPI] = {}


def register(kpi: KPI) -> None:
    _registry[kpi.id] = kpi


def _seed(period: str) -> int:
    year = int(period[:4])
    q = int(period[-1])
    return year * 4 + q

# simple deterministic calculators

def _rev(period: str) -> float:
    s = _seed(period)
    return 1000000 + s * 1000

def _gm(period: str) -> float:
    return 60.0

def _nrr(period: str) -> float:
    return 105.0

def _churn(period: str) -> float:
    return 2.0

def _wau_mau(period: str) -> float:
    return 70.0

def _uptime(period: str) -> float:
    return 99.9

def _mttr(period: str) -> float:
    return 1.5

def _ccc(period: str) -> float:
    return 30.0

def _inventory_turns(period: str) -> float:
    return 8.0

def _placeholder(period: str) -> float:
    return 0.0

# register ~12 KPIs
register(KPI("revenue", "Total revenue", "USD", "finance", _rev))
register(KPI("gm_percent", "Gross margin %", "%", "finance", _gm))
register(KPI("nrr", "Net revenue retention", "%", "finance", _nrr))
register(KPI("churn_percent", "Customer churn %", "%", "sales", _churn))
register(KPI("wau_mau", "WAU/MAU ratio", "%", "product", _wau_mau))
register(KPI("uptime", "Service uptime", "%", "sre", _uptime))
register(KPI("mttr", "Mean time to recover", "hours", "sre", _mttr))
register(KPI("ccc", "Cash conversion cycle", "days", "finance", _ccc))
register(KPI("inventory_turns", "Inventory turns", "x", "supply", _inventory_turns))
register(KPI("arpu", "Average revenue per user", "USD", "finance", _placeholder))
register(KPI("cac", "Customer acquisition cost", "USD", "marketing", _placeholder))
register(KPI("ltv", "Lifetime value", "USD", "finance", _placeholder))


def compute(period: str) -> List[Dict[str, float]]:
    rows = []
    for kpi in _registry.values():
        rows.append({"id": kpi.id, "value": kpi.calc(period), "unit": kpi.unit})
    out = IR_ARTIFACTS / f"kpi_{period}.json"
    with out.open("w") as f:
        json.dump({r["id"]: r for r in rows}, f, indent=2)
    log_metric("ir_kpi_compute")
    return rows
