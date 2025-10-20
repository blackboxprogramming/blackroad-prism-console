from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from lake import io as lake_io


@dataclass
class Supplier:
    supplier: str
    sku: str
    unit_price: float
    moq: int
    lead_time: int
    defect_ppm: int


def choose_mix(
    demand: Dict[str, int], suppliers: List[Supplier], policy: Dict[str, Any]
) -> Dict[str, Any]:
    risk_weight = policy.get("risk_weight", 0.0)
    defect_penalty = policy.get("defect_penalty", 0.0)
    dual_min = policy.get("dual_source_min_pct", 0.0)
    max_suppliers = policy.get("max_supplier_count", 1)

    awards = []
    for sku, units in demand.items():
        options = [s for s in suppliers if s.sku == sku]
        options.sort(
            key=lambda s: s.unit_price
            + risk_weight * s.lead_time
            + defect_penalty * (s.defect_ppm / 1e6)
        )
        if not options:
            continue
        first = options[0]
        if len(options) > 1 and max_suppliers > 1:
            second = options[1]
            requested_second_units = max(int(units * dual_min), second.moq)
            second_units = min(requested_second_units, units)
            first_units = units - second_units

            if second_units < second.moq:
                second_units = 0
                first_units = units

            if first_units > 0:
                awards.append(
                    {
                        "supplier": first.supplier,
                        "sku": sku,
                        "units": first_units,
                        "unit_price": first.unit_price,
                    }
                )
            if second_units > 0:
                awards.append(
                    {
                        "supplier": second.supplier,
                        "sku": sku,
                        "units": second_units,
                        "unit_price": second.unit_price,
                    }
                )
        else:
            awards.append(
                {
                    "supplier": first.supplier,
                    "sku": sku,
                    "units": units,
                    "unit_price": first.unit_price,
                }
            )

    total_cost = sum(a["units"] * a["unit_price"] for a in awards)
    for a in awards:
        lake_io.write(
            "finance_txn", {"week": "0", "cash_in": 0, "cash_out": a["units"] * a["unit_price"]}
        )

    return {"awards": awards, "tco": round(total_cost, 2)}
