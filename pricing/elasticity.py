from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any
import yaml
import csv
import json

from sales import catalog

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "sales" / "elasticity"
ART = ROOT / "artifacts" / "pricing"


@dataclass
class Scenario:
    sku: str
    price_delta_pct: float
    promo: bool


def _curve_for_sku(sku: str) -> Dict[str, Any]:
    cat = catalog.load_artifact()
    fam = None
    for prod in cat.get("products", []):
        if sku in prod.get("skus", []):
            fam = prod.get("family")
            break
    if fam is None:
        raise ValueError("unknown sku")
    data = yaml.safe_load((FIXTURES / f"{fam}.yaml").read_text())
    return data


def simulate(scenarios: List[Dict[str, Any]], horizon_m: int) -> Dict[str, Any]:
    results = []
    catalog_data = catalog.load_artifact()
    base_price_lookup = {p["sku"]: p["base_price"] for p in catalog_data.get("pricebook", [])}
    for sc in scenarios:
        curve = _curve_for_sku(sc["sku"])
        base_demand = curve["base_demand"]
        elasticity = curve["elasticity"]
        margin = curve.get("margin", 0)
        base_price = base_price_lookup[sc["sku"]]
        price = base_price * (1 + sc.get("price_delta_pct", 0))
        demand = base_demand * (1 + elasticity * sc.get("price_delta_pct", 0))
        revenue = demand * price
        base_revenue = base_demand * base_price
        margin_new = revenue * margin
        margin_base = base_revenue * margin
        results.append(
            {
                "sku": sc["sku"],
                "demand_delta": round(demand - base_demand, 2),
                "revenue_delta": round(revenue - base_revenue, 2),
                "margin_delta": round(margin_new - margin_base, 2),
            }
        )
    ART.mkdir(parents=True, exist_ok=True)
    ts = "sim_0000"
    out = ART / ts
    out.mkdir(exist_ok=True)
    summary_path = out / "summary.md"
    md = ["| SKU | DemandΔ | RevenueΔ | MarginΔ |", "|---|---:|---:|---:|"]
    for r in results:
        md.append(
            f"|{r['sku']}|{r['demand_delta']:.2f}|{r['revenue_delta']:.2f}|{r['margin_delta']:.2f}|"
        )
    summary_path.write_text("\n".join(md))
    series_path = out / "series.csv"
    with open(series_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["month", "sku", "demand", "revenue"])
        for month in range(1, horizon_m + 1):
            for r in results:
                base_demand = _curve_for_sku(r["sku"]) ["base_demand"]
                base_price = base_price_lookup[r["sku"]]
                demand = base_demand + r["demand_delta"]
                revenue = (base_price + r["revenue_delta"] / base_demand) * demand
                writer.writerow([month, r["sku"], round(demand, 2), round(revenue, 2)])
    return {"results": results, "summary_path": str(summary_path), "series_path": str(series_path)}
