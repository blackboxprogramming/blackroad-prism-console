from __future__ import annotations

import csv
import json
import random
from datetime import datetime
from pathlib import Path
from statistics import mean, stdev
from typing import Dict, List, Optional

import yaml  # type: ignore[import-untyped]

import settings
from orchestrator import orchestrator
from orchestrator.env_stamp import create_env_stamp
from orchestrator.protocols import Task
from orchestrator.slo import SLO_CATALOG
from tools import storage

ARTIFACTS = Path("artifacts/bench")
METRICS_PATH = Path("artifacts/metrics.jsonl")
SCENARIOS_DIR = Path("bench/scenarios")


def list_scenarios() -> List[str]:
    names = []
    for p in SCENARIOS_DIR.glob("*.yml"):
        cfg = yaml.safe_load(p.read_text())
        names.append(cfg.get("bot", p.stem))
    return names


def load_scenario(name: str) -> Dict:
    path = SCENARIOS_DIR / f"{name.lower().replace(' ', '-')}.yml"
    data = yaml.safe_load(path.read_text())
    return data


def _quantile(sorted_samples: List[int], q: float) -> int:
    if not sorted_samples:
        return 0
    pos = (len(sorted_samples) - 1) * q
    lower = sorted_samples[int(pos)]
    upper = sorted_samples[min(int(pos) + 1, len(sorted_samples) - 1)]
    return int(lower + (upper - lower) * (pos - int(pos)))


def run_bench(name: str, iterations: int = 20, warmup: int = 5, cache: str = "na", export_csv: Optional[Path] = None) -> Dict:
    random.seed(getattr(settings, "RANDOM_SEED", 0))
    scenario = load_scenario(name)
    bot = scenario["bot"]
    goal = scenario["goal"]
    ctx = scenario.get("context", {})
    bench_dir = ARTIFACTS / bot
    bench_dir.mkdir(parents=True, exist_ok=True)
    summary_path = bench_dir / "summary.json"
    prev_path = bench_dir / "previous_summary.json"
    if summary_path.exists():
        summary_path.replace(prev_path)
    env_path = create_env_stamp(bench_dir / "env.json")

    timings: List[int] = []
    rss_samples: List[int] = []
    for i in range(warmup + iterations):
        task = Task(id=f"BENCH{i}", goal=goal, context=ctx, created_at=datetime.utcnow())
        response = orchestrator.route(task, bot)
        if i >= warmup:
            timings.append(response.elapsed_ms or 0)
            rss_samples.append(response.rss_mb or 0)
    sorted_times = sorted(timings)
    p50 = _quantile(sorted_times, 0.5)
    p90 = _quantile(sorted_times, 0.9)
    p95 = _quantile(sorted_times, 0.95)
    mean_t = int(mean(timings)) if timings else 0
    stdev_t = int(stdev(timings)) if len(timings) > 1 else 0
    mean_rss = int(mean(rss_samples)) if rss_samples else 0
    slo = SLO_CATALOG.get(bot)
    summary = {
        "name": bot,
        "iterations": iterations,
        "p50": p50,
        "p90": p90,
        "p95": p95,
        "min": min(sorted_times) if sorted_times else 0,
        "max": max(sorted_times) if sorted_times else 0,
        "mean": mean_t,
        "stdev": stdev_t,
        "rss_mean": mean_rss,
        "cache": cache,
        "env": str(env_path),
        "timestamp": datetime.utcnow().isoformat(),
    }
    if slo:
        summary["slo"] = {
            "p50_target": slo.p50_ms,
            "p95_target": slo.p95_ms,
            "max_mem_mb": slo.max_mem_mb,
        }
        summary["pass_p95"] = p95 <= slo.p95_ms
    timings_path = bench_dir / "timings.csv"
    with open(timings_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["iteration", "elapsed_ms", "rss_mb"])
        for idx, (t, r) in enumerate(zip(timings, rss_samples)):
            writer.writerow([idx, t, r])
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    if export_csv:
        export_csv.parent.mkdir(parents=True, exist_ok=True)
        export_csv.write_text(timings_path.read_text(), encoding="utf-8")
    storage.write(str(METRICS_PATH), {"event": "bench_run", "name": bot, "pass": summary.get("pass_p95", True)})
    if prev_path.exists():
        prev = json.loads(prev_path.read_text())
        delta = prev.get("mean", 0) - mean_t
        with open(bench_dir / "cache_savings.md", "w", encoding="utf-8") as fh:
            fh.write("|metric|previous|current|delta|\n")
            fh.write("|---|---|---|---|\n")
            fh.write(f"|mean_ms|{prev.get('mean',0)}|{mean_t}|{delta}|\n")
    return summary


def run_all() -> Dict[str, Dict]:
    results = {}
    for name in list_scenarios():
        results[name] = run_bench(name)
    return results
