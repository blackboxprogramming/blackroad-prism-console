from __future__ import annotations

import json
import statistics
from collections import defaultdict
from pathlib import Path
from typing import Dict

import yaml

from .registry import ARTIFACTS, Experiment, assign_variant

ROOT = Path(__file__).resolve().parents[1]
EVENTS = ROOT / "fixtures" / "product" / "events.jsonl"


def analyze(exp: Experiment, metrics_config: str) -> Dict:
    # metrics_config unused but kept for API compatibility
    data = [json.loads(line) for line in EVENTS.read_text().splitlines() if line.strip()]
    users_variant = {}
    for d in data:
        u = str(d["user"])
        if u not in users_variant:
            users_variant[u] = assign_variant(exp, u)
    counts = {v: defaultdict(int) for v in exp.variants}
    revenue = {v: 0.0 for v in exp.variants}
    signup_time = {v: {} for v in exp.variants}
    ttv_values = {v: [] for v in exp.variants}
    for d in data:
        u = str(d["user"])
        v = users_variant[u]
        if v not in exp.variants:
            continue
        event = d["event"]
        ts = d["ts"]
        if event == "signup":
            counts[v]["signup"] += 1
            signup_time[v][u] = ts
        elif event == "activation":
            counts[v]["activation"] += 1
        elif event == "paywall":
            counts[v]["paywall"] += 1
        elif event == "purchase":
            counts[v]["purchase"] += 1
            revenue[v] += d.get("value", 0)
            if u in signup_time[v]:
                try:
                    start = signup_time[v][u]
                    diff = (
                        __import__("datetime").datetime.fromisoformat(ts)
                        - __import__("datetime").datetime.fromisoformat(start)
                    ).days
                    ttv_values[v].append(diff)
                except Exception:
                    pass
        elif event == "retention":
            counts[v]["retention"] += 1
    # compute time-to-value from ttv_values
    results = {}
    for v in exp.variants:
        act_rate = counts[v]["activation"] / counts[v]["signup"] if counts[v]["signup"] else 0
        conversion = counts[v]["purchase"] / counts[v]["paywall"] if counts[v]["paywall"] else 0
        arpu = revenue[v] / counts[v]["signup"] if counts[v]["signup"] else 0
        ttv = statistics.mean(ttv_values[v]) if ttv_values[v] else 0
        results[v] = {
            "activation_rate": act_rate,
            "conversion": conversion,
            "arpu": arpu,
            "ttv": ttv,
        }
    A, B = exp.variants[:2]
    metric_table = {}
    for m in ["activation_rate", "conversion", "arpu", "ttv"]:
        av = results[A][m]
        bv = results[B][m]
        lift = (bv - av) / av if av else 0
        metric_table[m] = {"A": av, "B": bv, "lift": lift}
    decision = "ship" if all(metric_table[m]["lift"] >= 0 for m in ["activation_rate", "conversion", "arpu"]) else "hold"
    out = {"metrics": metric_table, "decision": decision}
    out_dir = ARTIFACTS / exp.id
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "result.json").write_text(json.dumps(out, indent=2))
    md_lines = ["|metric|A|B|lift|", "|---|---|---|---|"]
    for m, v in metric_table.items():
        md_lines.append(f"|{m}|{v['A']:.2f}|{v['B']:.2f}|{v['lift']:.2f}|")
    md_lines.append(f"Decision: {decision}")
    (out_dir / "result.md").write_text("\n".join(md_lines))
    return out
