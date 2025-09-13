import os
import json
from pathlib import Path

import pytest

from lake import layout, io, timeseries
from contracts import validate
from pipelines import finance_margin_pipeline, reliability_pipeline
from semantic import query
from retrieval import index as retrieval_index
import importlib
parquet_csv_bridge = importlib.import_module('lakeio.parquet_csv_bridge')


@pytest.fixture
def temp_lake(tmp_path, monkeypatch):
    layout.LAKE_ROOT = tmp_path / "lake"
    layout.LAKE_FORMAT = "csv"
    io.LAKE_FORMAT = "csv"
    yield tmp_path / "lake"


def test_write_scan_csv(temp_lake):
    rows = [{"a": 1}]
    for name in ["metrics", "tasks", "artifacts", "finance_txn"]:
        io.write_table(name, rows)
        assert list(io.scan_table(name)) == rows


@pytest.mark.skipif(not layout.HAS_ARROW, reason="pyarrow missing")
def test_write_scan_parquet(tmp_path, monkeypatch):
    layout.LAKE_ROOT = tmp_path / "lake"
    layout.LAKE_FORMAT = "parquet"
    io.LAKE_FORMAT = "parquet"
    rows = [{"a": 1}]
    for name in ["metrics", "tasks", "artifacts", "finance_txn"]:
        io.write_table(name, rows)
        assert list(io.scan_table(name)) == rows


def test_contract_validation(tmp_path):
    path = tmp_path / "opps.csv"
    with open(path, "w", newline="", encoding="utf-8") as fh:
        fh.write("id,name,stage,amount\n1,Deal,open,10\n")
    validate.validate_file("crm_opps", path)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        fh.write("id,name,stage,amount\n1,Deal,bad,10\n")
    with pytest.raises(validate.ContractError):
        validate.validate_file("crm_opps", path)


def test_semantic_queries(temp_lake):
    finance_margin_pipeline.run()
    reliability_pipeline.run()
    rev = query.evaluate("revenue", {}, ["region"])
    gm = query.evaluate("gross_margin_pct", {}, ["region"])
    up = query.evaluate("uptime", {}, ["date"])
    assert any(r["region"] == "NA" and r["revenue"] == 100 for r in rev)
    assert any(r["region"] == "EU" and round(r["gross_margin_pct"], 2) == 40.0 for r in gm)
    assert any(r["date"] == "2025-06-01" and round(r["uptime"], 2) == 99.31 for r in up)


def test_retrieval(tmp_path, monkeypatch):
    artifacts = tmp_path / "artifacts"
    artifacts.mkdir()
    (artifacts / "doc1.txt").write_text("error budget policy")
    (artifacts / "doc2.txt").write_text("nothing here")
    retrieval_index.ARTIFACTS = artifacts
    retrieval_index.INDEX_PATH = artifacts / "index.json"
    retrieval_index.build()
    hits = retrieval_index.search("error budget")
    assert hits and "doc1.txt" in hits[0]["path"]


def test_import_export(temp_lake):
    rows = [{"id": 1, "name": "Deal", "stage": "open", "amount": 10.0}]
    validate.validate_rows("crm_opps", rows)
    io.write_table("crm_opps", rows)
    out = Path(temp_lake.parent) / "opps.csv"
    parquet_csv_bridge.export_table("crm_opps", "csv", out)
    parquet_csv_bridge.import_table("crm_opps", "csv", out)
    all_rows = list(io.scan_table("crm_opps"))
    assert len(all_rows) == 2


def test_resample():
    rows = [
        {"date": "2025-06-01", "value": 1},
        {"date": "2025-06-03", "value": 1},
    ]
    res = timeseries.resample(rows, "date", "D", {"value": "sum"})
    assert len(res) == 3
    assert res[1]["value"] == 0

