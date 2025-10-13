import json
from pathlib import Path

import ir.guidance as guidance
from ir import utils


def test_guidance_range(monkeypatch, tmp_path):
    monkeypatch.setattr(guidance, "IR_ARTIFACTS", tmp_path)
    monkeypatch.setattr(utils, "METRICS_PATH", tmp_path / "m.jsonl")
    assumptions = tmp_path / "assume.yaml"
    assumptions.write_text("seasonality: 1.0\npipeline_quality: 1.0\nsupply_constraints: 1.0\nfx: 0")
    guidance.run("2025Q4", assumptions)
    data = json.loads((tmp_path / "guidance_2025Q4" / "ranges.json").read_text())
    assert "revenue" in data and "base" in data["revenue"]
