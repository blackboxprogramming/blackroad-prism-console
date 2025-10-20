from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict

from lake import io as lake_io


@dataclass
class SimParams:
    starting_inventory: int
    reorder_point: int
    lead_time: int
    moq: int
    lot_size: int
    unit_cost: float
    carrying_cost_pct: float
    logistics_cost_per_unit: float
    demand_series: list
    returns_pct: float = 0.0


def simulate(params: Dict[str, Any], horizon_days: int) -> Dict[str, Any]:
    p = SimParams(**params)
    inventory = p.starting_inventory
    on_hand_series = []
    stockouts = 0
    shipped = 0
    orders = []  # list of (arrival_day, qty)
    for day in range(horizon_days):
        # arrivals
        arriving = [qty for (arr_day, qty) in orders if arr_day == day]
        if arriving:
            inventory += sum(arriving)
        orders = [(a, q) for (a, q) in orders if a != day]

        demand = p.demand_series[day % len(p.demand_series)]
        ship = min(demand, inventory)
        inventory -= ship
        shipped += ship
        stockouts += demand - ship
        returns = ship * p.returns_pct
        inventory += returns
        on_hand_series.append(inventory)

        if inventory <= p.reorder_point:
            qty = max(p.moq, p.lot_size)
            orders.append((day + p.lead_time, qty))

        lake_io.write("inventory", {"sku": "sku", "date": str(day), "on_hand": inventory})

    avg_on_hand = sum(on_hand_series) / horizon_days
    turns = shipped / avg_on_hand if avg_on_hand else 0
    carrying_cost = avg_on_hand * p.unit_cost * p.carrying_cost_pct * (horizon_days / 365)
    logistics_cost = shipped * p.logistics_cost_per_unit

    summary = {
        "stockouts": stockouts,
        "average_on_hand": round(avg_on_hand, 2),
        "turns": round(turns, 4),
        "carrying_cost": round(carrying_cost, 2),
        "logistics_cost": round(logistics_cost, 2),
    }

    return summary
