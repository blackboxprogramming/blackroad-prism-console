from pathlib import Path

from twin import stress


def test_run_load(tmp_path):
    profile = stress.load_profile("default")
    out = stress.run_load(profile, 2)
    summary = Path(out / "summary.json").read_text()
    assert "\"tasks\": 2" in summary
