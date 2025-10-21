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
import csv
import random
import statistics
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import yaml

from orchestrator import orchestrator
from orchestrator.env_stamp import create_env_stamp
from orchestrator.perf import perf_timer
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
ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "bench"
SCENARIOS = Path(__file__).parent / "scenarios"


def _quantile(sorted_vals: List[int], q: float) -> int:
    if not sorted_vals:
        return 0
    idx = (len(sorted_vals) - 1) * q
    lower = int(idx)
    upper = min(lower + 1, len(sorted_vals) - 1)
    frac = idx - lower
    return int(sorted_vals[lower] + (sorted_vals[upper] - sorted_vals[lower]) * frac)


def list_scenarios() -> List[str]:
    """Return scenario names sorted for stable CLI output."""

    return sorted(p.stem for p in SCENARIOS.glob("*.yml"))


def show_scenario(name: str) -> Dict:
    path = SCENARIOS / f"{name}.yml"
    if not path.exists():
        raise ValueError(f"Unknown scenario: {name}")
    return yaml.safe_load(path.read_text())


def run_bench(name: str, iterations: int = 20, warmup: int = 5, cache: str = "na") -> Dict:
    sc = show_scenario(name)
    random.seed(name)  # deterministic
    env_path = create_env_stamp(ARTIFACTS / name)
    csv_rows = []
    elapsed_samples = []
    rss_samples = []
    for i in range(iterations):
        task = Task(id=f"B{i:04d}", goal=sc["goal"], context=None, created_at=datetime.utcnow())
        with perf_timer("bot_run") as perf:
            orchestrator.route(task, sc["bot"])
        csv_rows.append({"iter": i, **perf})
        if i >= warmup:
            elapsed_samples.append(perf["elapsed_ms"])
            if perf["rss_mb"] is not None:
                rss_samples.append(perf["rss_mb"])
    elapsed_samples.sort()
    p50 = _quantile(elapsed_samples, 0.5)
    p90 = _quantile(elapsed_samples, 0.9)
    p95 = _quantile(elapsed_samples, 0.95)
    summary = {
        "name": name,
        "ts": datetime.utcnow().isoformat(),
        "p50": p50,
        "p90": p90,
        "p95": p95,
        "min": min(elapsed_samples) if elapsed_samples else 0,
        "max": max(elapsed_samples) if elapsed_samples else 0,
        "mean": int(statistics.mean(elapsed_samples)) if elapsed_samples else 0,
        "stdev": int(statistics.pstdev(elapsed_samples)) if len(elapsed_samples) > 1 else 0,
        "rss_mean": int(statistics.mean(rss_samples)) if rss_samples else 0,
        "env": env_path,
        "cache": cache,
    }
    slo = SLO_CATALOG.get(name)
    if slo:
        summary.update(
            {
                "p95_target": slo.p95_ms,
                "p50_target": slo.p50_ms,
                "max_mem_mb": slo.max_mem_mb,
                "pass": summary["p95"] <= slo.p95_ms,
            }
        )
    bench_dir = ARTIFACTS / name
    bench_dir.mkdir(parents=True, exist_ok=True)
    csv_path = bench_dir / "timings.csv"
    with csv_path.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["iter", "elapsed_ms", "rss_mb"])
        writer.writeheader()
        for row in csv_rows:
            writer.writerow(row)
    summary_path = bench_dir / "summary.json"
    prev_summary = bench_dir / "previous_summary.json"
    if summary_path.exists():
        prev_summary.write_text(summary_path.read_text())
    storage.write(str(summary_path), summary)
    storage.write(
        str(ROOT / "artifacts" / "metrics.jsonl"),
        {"event": "bench_run", "name": name, "pass": summary.get("pass", True)},
    )
    return summary


def run_all(iterations: int = 20, warmup: int = 5) -> List[Dict]:
    results = []
    for name in list_scenarios():
        results.append(run_bench(name, iterations=iterations, warmup=warmup))
    return results


def run_cache_experiment(name: str, iterations: int = 20, warmup: int = 5) -> Path:
    off = run_bench(name, iterations, warmup, cache="off")
    on = run_bench(name, iterations, warmup, cache="on")
    speedup = (off["p50"] / on["p50"]) if on["p50"] else 0
    mem_delta = off["rss_mean"] - on["rss_mean"]
    bench_dir = ARTIFACTS / name
    md = (
        "| mode | p50 | rss_mean |\n|---|---|---|\n"
        + f"| off | {off['p50']} | {off['rss_mean']} |\n| on | {on['p50']} | {on['rss_mean']} |\n\n"
        + f"speedup: {speedup:.2f}x\nmem_delta: {mem_delta}\n"
    )
    path = bench_dir / "cache_savings.md"
    storage.write(str(path), md)
    return path
