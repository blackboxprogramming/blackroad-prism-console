from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List
from tools import storage, artifacts, metrics
from .journal import load_tb

ARTIFACTS_ROOT = Path("artifacts/close")
SCHEMA = "contracts/schemas/flux_results.json"


def _tb_map(tb: List[dict]) -> Dict[str, float]:
    totals: Dict[str, float] = {}
    for row in tb:
        amt = row["amount"] if row["drcr"] == "dr" else -row["amount"]
        totals[row["account"]] = totals.get(row["account"], 0.0) + amt
    return totals


def run_flux(period: str, prev: str, py: str, threshold: float) -> List[dict]:
    curr = _tb_map(load_tb(period))
    prev_tb = _tb_map(load_tb(prev))
    results: List[dict] = []
    for acct, amt in sorted(curr.items()):
        prev_amt = prev_tb.get(acct, 0.0)
        delta = amt - prev_amt
        pct = (delta / prev_amt * 100) if prev_amt else None
        flag = abs(pct or 0) >= threshold
        results.append(
            {
                "account": acct,
                "current": round(amt, 2),
                "prev": round(prev_amt, 2),
                "delta": round(delta, 2),
                "pct": round(pct, 2) if pct is not None else None,
                "flag": flag,
            }
        )
    path = ARTIFACTS_ROOT / period / "flux"
    artifacts.validate_and_write(str(path / "flux.json"), results, SCHEMA)
    csv_path = path / "flux.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=["account", "current", "prev", "delta", "pct", "flag"])
        writer.writeheader()
        writer.writerows(results)
    lines = [f"{r['account']}: {r['delta']} ({r['pct']})" for r in results]
    artifacts.validate_and_write(str(path / "flux.md"), "\n".join(lines))
    metrics.emit("flux_generated", len(results))
    return results
