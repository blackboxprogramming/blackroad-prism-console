import json
from pathlib import Path

import ir.kpi_sot as kpi_sot
from ir import utils


def test_compute_returns_kpis(monkeypatch, tmp_path):
    monkeypatch.setattr(utils, "METRICS_PATH", tmp_path / "m.jsonl")
    rows = kpi_sot.compute("2025Q3")
    ids = {r["id"] for r in rows}
    assert "revenue" in ids
    assert len(rows) >= 12
