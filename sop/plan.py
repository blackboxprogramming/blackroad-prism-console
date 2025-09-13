from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass
class DemandSignal:
    date: str
    sku: str
    region: str
    units: int


@dataclass
class SupplyPlan:
    date: str
    sku: str
    site: str
    capacity_units: int


def reconcile(
    demand: List[DemandSignal], supply: List[SupplyPlan], policy: Dict[str, Any]
) -> Dict[str, Any]:
    # aggregate demand by region
    demand_by_region: Dict[str, int] = {}
    total_demand = 0
    for d in demand:
        demand_by_region[d.region] = demand_by_region.get(d.region, 0) + d.units
        total_demand += d.units

    total_supply = sum(s.capacity_units for s in supply)
    allocations = []
    backorders = []
    remaining = total_supply

    allocation_rule = policy.get("allocation_rule", [])
    backorder_allowed = policy.get("backorder_allowed", True)

    for region in allocation_rule:
        dem = demand_by_region.get(region, 0)
        alloc = min(dem, remaining)
        if alloc > 0:
            allocations.append({"region": region, "units": alloc})
        remaining -= alloc
        bo = dem - alloc
        if bo > 0 and backorder_allowed:
            backorders.append({"region": region, "units": bo})
        demand_by_region.pop(region, None)

    # any remaining demand not in allocation_rule
    for region, dem in demand_by_region.items():
        alloc = min(dem, remaining)
        if alloc > 0:
            allocations.append({"region": region, "units": alloc})
        remaining -= alloc
        bo = dem - alloc
        if bo > 0 and backorder_allowed:
            backorders.append({"region": region, "units": bo})

    allocated_units = sum(a["units"] for a in allocations)
    service_level = allocated_units / total_demand if total_demand else 0
    capacity_util = allocated_units / total_supply if total_supply else 0

    return {
        "allocations": allocations,
        "backorders": backorders,
        "service_level": round(service_level, 4),
        "capacity_util": round(capacity_util, 4),
    }
