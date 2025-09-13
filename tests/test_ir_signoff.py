from pathlib import Path

import ir.kpi_signoff as signoff
from ir import utils


def test_approve_reject_flow(monkeypatch, tmp_path):
    monkeypatch.setattr(signoff, "IR_ARTIFACTS", tmp_path)
    monkeypatch.setattr(utils, "METRICS_PATH", tmp_path / "m.jsonl")
    signoff.request_signoff("revenue", "2025Q3")
    signoff.approve("revenue", "2025Q3", "U_CFO")
    log = (tmp_path / "signoff.jsonl").read_text().splitlines()
    assert any("approve" in line for line in log)
