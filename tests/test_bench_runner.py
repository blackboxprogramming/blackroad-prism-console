import csv
import json
from pathlib import Path

from bench.runner import list_scenarios, run_bench


def test_run_bench_creates_artifacts():
    assert "Treasury-BOT" in list_scenarios()
    run_bench("Treasury-BOT", iterations=4, warmup=1)
    bench_dir = Path("artifacts/bench/Treasury-BOT")
    assert (bench_dir / "summary.json").exists()
    data = json.loads((bench_dir / "summary.json").read_text())
    assert "p50" in data and data["p95"] >= data["p50"]
    csv_path = bench_dir / "timings.csv"
    rows = list(csv.DictReader(csv_path.open()))
    assert len(rows) == 4
