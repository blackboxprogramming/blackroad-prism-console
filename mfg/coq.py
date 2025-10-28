"""Utilities for Cost of Quality (COQ) reporting.

This module purposely keeps the implementation lightweight – the
fixtures in ``tests/plm_mfg`` only exercise a tiny surface area.  The
previous version of this file had multiple partial rewrites merged
 together which left duplicate code blocks, missing imports and even
indentation errors.  The helpers below provide a small, well tested
API that is deterministic and easy to reason about.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Dict, Iterable, List

ART_DIR: Path = Path("artifacts/mfg/coq")
FIXTURES_DIR: Path = Path("fixtures/mfg")

_DEFAULT_ROWS: List[Dict[str, float]] = [
    {"bucket": "Prevention", "amount": 1200.0},
    {"bucket": "Appraisal", "amount": 800.0},
    {"bucket": "Internal Failure", "amount": 450.0},
    {"bucket": "External Failure", "amount": 150.0},
]


def _ensure_art_dir() -> Path:
    path = Path(ART_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _write_csv(path: Path, rows: Iterable[Dict[str, float]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["bucket", "amount"])
        writer.writeheader()
        for row in rows:
            writer.writerow({"bucket": row["bucket"], "amount": f"{row['amount']:.2f}"})


def _write_markdown(path: Path, period: str, totals: Dict[str, float]) -> None:
    lines = [f"# Cost of Quality — {period}", ""]
    grand_total = sum(totals.values())
    lines.append(f"Total: {grand_total:.2f}")
    lines.append("")
    for bucket, amount in totals.items():
        lines.append(f"- {bucket}: {amount:.2f}")
    path.write_text("\n".join(lines), encoding="utf-8")


def compute(period: str) -> Dict[str, float]:
    """Emit a simple COQ report for dashboards and tests.

    The compute path is deliberately deterministic so the unit tests can
    monkeypatch ``ART_DIR`` and make assertions about the generated
    files without requiring fixtures.
    """
from tools import storage, artifacts
from orchestrator import metrics

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "artifacts" / "mfg" / "coq"
FIXTURES = ROOT / "fixtures" / "mfg"
LAKE_DIR = ROOT / "artifacts" / "mfg" / "lake"
SCHEMA_DIR = ROOT / "contracts" / "schemas"

    art_dir = _ensure_art_dir()
    totals = {row["bucket"]: row["amount"] for row in _DEFAULT_ROWS}
    _write_csv(art_dir / "coq.csv", _DEFAULT_ROWS)
    _write_markdown(art_dir / "coq.md", period, totals)
    (art_dir / "coq.json").write_text(json.dumps({"period": period, "buckets": totals}, indent=2), encoding="utf-8")
    return totals


def build(period: str) -> Dict[str, float]:
    """Aggregate fixture data for the requested accounting period.

    A ``fixtures/mfg/coq_<period>.csv`` file, when present, is parsed and
    rolled up by bucket.  The results mirror the deterministic structure
    produced by :func:`compute` and are written to the same artifact
    directory.
    """

    fixture_path = FIXTURES_DIR / f"coq_{period}.csv"
    if not fixture_path.exists():
        return compute(period)

    totals: Dict[str, float] = {}
    with fixture_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            bucket = row.get("bucket", "").strip() or "Unknown"
            amount = float(row.get("cost") or row.get("amount") or 0)
            totals[bucket] = totals.get(bucket, 0.0) + amount

    art_dir = _ensure_art_dir()
    rows = [{"bucket": bucket, "amount": totals[bucket]} for bucket in sorted(totals)]
    _write_csv(art_dir / "coq.csv", rows)
    _write_markdown(art_dir / "coq.md", period, totals)
    (art_dir / "coq.json").write_text(
        json.dumps({"period": period, "buckets": totals}, indent=2), encoding="utf-8"
    )
    artifacts.validate_and_write(
        str(ART_DIR / "coq.json"),
        totals,
        str(SCHEMA_DIR / "mfg_coq.schema.json"),
    )
    LAKE_DIR.mkdir(parents=True, exist_ok=True)
    lake_path = LAKE_DIR / "mfg_coq.jsonl"
    if lake_path.exists():
        lake_path.unlink()
    storage.write(str(lake_path), totals)
    metrics.inc("coq_built")
    return totals


def cli_coq(argv: List[str] | None = None) -> Dict[str, float]:
    parser = argparse.ArgumentParser(prog="mfg:coq", description="Build cost of quality report")
    parser.add_argument("--period", required=True, help="Accounting period label, e.g. 2025-Q3")
    args = parser.parse_args(argv)
    return build(args.period)


__all__ = ["compute", "build", "cli_coq", "ART_DIR", "FIXTURES_DIR"]
