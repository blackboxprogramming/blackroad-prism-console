"""Manufacturing yield calculations for the unit tests."""

from __future__ import annotations

import argparse
import csv
import json
from math import prod
from pathlib import Path
from typing import Dict, Iterable, List

ART_DIR: Path = Path("artifacts/mfg/yield")
FIXTURES_DIR: Path = Path("fixtures/mfg")

_DEFAULT_STATIONS: List[Dict[str, int]] = [
    {"station": "SMT", "total": 120, "defects": 4},
    {"station": "Assembly", "total": 110, "defects": 6},
    {"station": "Test", "total": 105, "defects": 1},
]


def _ensure_art_dir() -> Path:
    path = Path(ART_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _load_fixture(period: str) -> List[Dict[str, int]]:
    fixture_path = FIXTURES_DIR / f"yield_{period}.csv"
    if not fixture_path.exists():
        return list(_DEFAULT_STATIONS)

    stations: List[Dict[str, int]] = []
    with fixture_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            stations.append(
                {
                    "station": row.get("station", "").strip() or "Unknown",
                    "total": int(float(row.get("total", 0) or 0)),
                    "defects": int(float(row.get("defects", 0) or 0)),
                }
            )
    return stations or list(_DEFAULT_STATIONS)


def _compute_station_metrics(stations: Iterable[Dict[str, int]]) -> List[Dict[str, float]]:
    enriched: List[Dict[str, float]] = []
    for raw in stations:
        total = max(int(raw.get("total", 0)), 0)
        defects = max(int(raw.get("defects", 0)), 0)
        yield_pct = (total - defects) / total if total else 0.0
        enriched.append(
            {
                "station": raw["station"],
                "total": float(total),
                "defects": float(defects),
                "yield_pct": yield_pct,
            }
        )
    return enriched


def compute(period: str) -> Dict[str, float]:
    stations = _compute_station_metrics(_load_fixture(period))
    if not stations:
        raise ValueError("no station data available")

    fpy = stations[0]["yield_pct"]
    rty = prod(step["yield_pct"] for step in stations) if stations else 0.0

    art_dir = _ensure_art_dir()
    summary = {
        "period": period,
        "fpy": fpy,
        "rty": rty,
        "stations": stations,
    }
    (art_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (art_dir / "summary.md").write_text(
        f"FPY: {fpy:.3f}\nRTY: {rty:.3f}\n", encoding="utf-8"
    )

    pareto_rows = sorted(stations, key=lambda row: row["defects"], reverse=True)
    with (art_dir / "pareto.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["station", "defects"])
        for row in pareto_rows:
            writer.writerow([row["station"], int(row["defects"])])

    return {"fpy": fpy, "rty": rty}


def cli_yield(argv: List[str] | None = None) -> Dict[str, float]:
    parser = argparse.ArgumentParser(prog="mfg:yield", description="Build yield report")
    parser.add_argument("--period", required=True, help="Reporting period, e.g. 2025-09")
    args = parser.parse_args(argv)
    return compute(args.period)


__all__ = ["compute", "cli_yield", "ART_DIR", "FIXTURES_DIR"]
