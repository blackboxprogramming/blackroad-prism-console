from pathlib import Path

from aiops import config_drift


def test_baseline_and_drift(tmp_path: Path):
    baseline = {"service": "CoreAPI", "version": 1}
    config_drift.record_baseline(baseline, artifacts_dir=tmp_path)
    drift = config_drift.compare({"service": "CoreAPI", "version": 2}, artifacts_dir=tmp_path)
    assert drift["diff"][0]["path"] == "version"
