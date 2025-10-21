from pathlib import Path

from twin import stress


def test_run_load(tmp_path):
    profile = stress.load_profile("default")
    out = stress.run_load(profile, 2)
    summary = Path(out / "summary.json").read_text()
    assert "\"tasks\": 2" in summary
from twin import stress


def test_stress_run(tmp_path, monkeypatch):
    cfg = tmp_path / "configs/stress"
    cfg.mkdir(parents=True)
    (cfg / "demo.yaml").write_text("arrival_rate: 2", encoding="utf-8")
    monkeypatch.chdir(tmp_path)
    profile = stress.load_profile("demo")
    res = stress.run_load(profile, 5)
    assert res["submitted"] == 10
    out = tmp_path / "artifacts/twin/stress_demo/summary.json"
    assert out.exists()
