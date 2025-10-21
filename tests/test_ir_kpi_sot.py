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
import jsonschema
from ir import kpi_sot
from ir.utils import IR_ARTIFACTS


def test_compute_kpis(tmp_path):
    period = "2025Q3"
    rows = kpi_sot.compute(period)
    assert any(r["id"] == "revenue" for r in rows)
    data = json.loads((IR_ARTIFACTS / f"kpi_{period}.json").read_text())
    schema = json.load(open("schemas/ir_kpi.schema.json"))
    jsonschema.validate(data, schema)
