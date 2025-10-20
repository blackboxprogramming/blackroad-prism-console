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
import json
from pathlib import Path
from typing import Dict

from .journal import load_tb

ARTIFACTS_ROOT = Path("artifacts/close")


def _tb_map(tb: Dict[str, float]) -> Dict[str, float]:
    return tb


def run_flux(period: str, prev: str, py: str, threshold: float) -> Dict[str, dict]:
    tb_cur = _tb_map(load_tb(period))
    tb_prev = _tb_map(load_tb(prev))
    tb_py = _tb_map(load_tb(py)) if py else {}
    rows = {}
    accounts = set(tb_cur) | set(tb_prev) | set(tb_py)
    for acct in sorted(accounts):
        cur = tb_cur.get(acct, 0.0)
        prev_amt = tb_prev.get(acct, 0.0)
        change = cur - prev_amt
        pct = (change / prev_amt * 100) if prev_amt else 0.0
        flagged = abs(pct) >= threshold
        rows[acct] = {
            "current": cur,
            "prev": prev_amt,
            "change": change,
            "pct": pct,
            "flag": flagged,
        }
    base = ARTIFACTS_ROOT / period / "flux"
    base.mkdir(parents=True, exist_ok=True)
    csv_path = base / "flux.csv"
    with csv_path.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["account", "current", "prev", "change", "pct", "flag"])
        for acct, row in rows.items():
            writer.writerow([acct, f"{row['current']:.2f}", f"{row['prev']:.2f}", f"{row['change']:.2f}", f"{row['pct']:.2f}", str(row['flag'])])
    (base / "flux.md").write_text("\n".join(f"{a}\t{r['change']:.2f}" for a, r in rows.items()) + "\n")
    (base / "flux.json").write_text(json.dumps(rows, indent=2))
    return rows
