from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from lake import io as lake_io


@dataclass
class Lane:
    origin: str
    dest: str
    mode: str
    base_rate: float
    fuel_adj: float
    lead_time: int


def optimize_lanes(
    demand_allocations: List[Dict[str, Any]], lanes: List[Lane], constraints: Dict[str, Any]
) -> Dict[str, Any]:
    total_units = sum(d["units"] for d in demand_allocations)
    max_air_units = total_units * constraints.get("max_air_pct", 1.0)
    sla_days = constraints.get("sla_days", 999)
    budget_cap = constraints.get("budget_cap", float("inf"))

    # filter lanes by sla
    valid_lanes = [ln for ln in lanes if ln.lead_time <= sla_days]
    plan = []
    cost_total = 0
    air_used = 0

    for alloc in demand_allocations:
        region = alloc["region"]
        units = alloc["units"]
        options = [ln for ln in valid_lanes if ln.dest == region]
        options.sort(key=lambda ln: ln.base_rate * (1 + ln.fuel_adj))
        for lane in options:
            if lane.mode == "air" and air_used + units > max_air_units:
                continue
            base = units * lane.base_rate
            surcharge = base * lane.fuel_adj
            total_cost_lane = base + surcharge
            if cost_total + total_cost_lane > budget_cap:
                continue
            plan.append(
                {
                    "origin": lane.origin,
                    "dest": lane.dest,
                    "mode": lane.mode,
                    "units": units,
                    "cost": round(total_cost_lane, 2),
                    "fuel_surcharge": round(surcharge, 2),
                }
            )
            cost_total += total_cost_lane
            if lane.mode == "air":
                air_used += units
            lake_io.write("logistics", plan[-1])
            break

    sla_hit = sum(p["units"] for p in plan) / total_units if total_units else 0
    fuel_surcharge = sum(p.get("fuel_surcharge", 0) for p in plan)
    return {
        "plan": plan,
        "total_cost": round(cost_total, 2),
        "sla_hit_pct": round(sla_hit, 4),
        "fuel_surcharge": round(fuel_surcharge, 2),
    }
