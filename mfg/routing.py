"""Very small routing helpers used in the capacity test."""

from __future__ import annotations

from typing import Dict, Iterable, List

WC_DB: Dict[str, Dict[str, float]] = {}
ROUT_DB: Dict[str, Dict[str, object]] = {}


def _iter_steps(item: str, rev: str) -> Iterable[dict]:
    routing = ROUT_DB.get(f"{item}_{rev}")
    if not routing:
        raise ValueError(f"routing not found for {item} rev {rev}")
    steps = routing.get("steps") or []
    if not isinstance(steps, list):
        raise ValueError("steps must be a list")
    for step in steps:
        if not isinstance(step, dict):
            raise ValueError("routing steps must be dictionaries")
        yield step


def capcheck(item: str, rev: str, qty: float) -> Dict[str, object]:
    """Aggregate standard times and theoretical labour cost.

    The helper expects ``WC_DB`` to contain work centre definitions with
    ``capacity_per_shift`` (in hours) and ``cost_rate`` (per hour).  The
    routing dictionary mirrors what the tests populate: a mapping with a
    ``steps`` list containing ``std_time_min`` values.
    """

    wc_totals: Dict[str, float] = {}
    for step in _iter_steps(item, rev):
        wc = step.get("wc")
        if not wc:
            continue
        std_time = float(step.get("std_time_min", 0) or 0)
        yield_pct = float(step.get("yield_pct", 100) or 100)
        effective = std_time / (yield_pct / 100.0) if yield_pct else std_time
        wc_totals[wc] = wc_totals.get(wc, 0.0) + qty * effective

    work_centers: Dict[str, Dict[str, float]] = {}
    labour_cost = 0.0
    for wc, required_min in wc_totals.items():
        wc_def = WC_DB.get(wc, {})
        capacity_hours = float(wc_def.get("capacity_per_shift", 0) or 0)
        cost_rate = float(wc_def.get("cost_rate", 0) or 0)
        capacity_min = capacity_hours * 60.0
        work_centers[wc] = {
            "required_minutes": required_min,
            "available_minutes": capacity_min,
        }
        labour_cost += (required_min / 60.0) * cost_rate

    return {
        "item": item,
        "rev": rev,
        "qty": qty,
        "work_centers": work_centers,
        "theoretical_labor_cost": labour_cost,
    }


__all__ = ["WC_DB", "ROUT_DB", "capcheck"]
