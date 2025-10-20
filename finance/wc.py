from __future__ import annotations

from typing import Any, Dict

from lake import io as lake_io


def cash_cycle(demand, awards, logistics_plan, terms) -> Dict[str, Any]:
    cogs = sum(a["units"] * a.get("unit_price", 0) for a in awards)
    revenue = cogs * 1.2  # assume 20% margin

    dso = terms.get("DSO", 0)
    dpo = terms.get("DPO", 0)
    inventory_days = terms.get("inventory_days", 0)
    ccc = dso + inventory_days - dpo

    weeks = max(len(demand), 1)
    weekly_in = revenue / weeks
    weekly_out = cogs / weeks
    cash_curve = []
    cash = 0
    for w in range(weeks):
        cash += weekly_in - weekly_out
        cash_curve.append({"week": str(w), "cash": round(cash, 2)})
        lake_io.write("finance_txn", {"week": str(w), "cash_in": weekly_in, "cash_out": weekly_out})

    return {"DSO": dso, "DPO": dpo, "CCC": ccc, "cash_curve": cash_curve}
