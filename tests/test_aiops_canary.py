import json
from pathlib import Path

from aiops import canary


def _write(path: Path, data: dict):
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh)


def test_canary_pass_fail(tmp_path: Path):
    base = tmp_path / "base.json"
    can = tmp_path / "canary.json"
    _write(base, {"latency_p50": 100, "latency_p95": 200, "error_rate": 0.01})
    _write(can, {"latency_p50": 110, "latency_p95": 210, "error_rate": 0.02})
    res = canary.analyze(base, can, artifacts_dir=tmp_path)
    assert res["result"] == "PASS"
    _write(can, {"latency_p50": 130, "latency_p95": 250, "error_rate": 0.2})
    res = canary.analyze(base, can, artifacts_dir=tmp_path)
    assert res["result"] == "FAIL"
