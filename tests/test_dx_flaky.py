import subprocess
from pathlib import Path

from dx import flaky


class R:
    def __init__(self, code):
        self.returncode = code


def fake_run(cmd, capture_output=True):
    fake_run.calls += 1
    return R(1 if fake_run.calls == 1 else 0)


fake_run.calls = 0


def test_flaky(tmp_path, monkeypatch):
    monkeypatch.setattr(flaky, "FLAKY_REPORT", tmp_path / "rep.json")
    monkeypatch.setattr(flaky, "QUARANTINE_FILE", tmp_path / "q.yaml")
    (tmp_path / "q.yaml").write_text("[]")
    monkeypatch.setattr(subprocess, "run", fake_run)
    data = flaky.run("tests/test_sample.py", 2)
    assert data["failures"] == 1
    flaky.quarantine_update()
    import yaml
    qlist = yaml.safe_load((tmp_path / "q.yaml").read_text())
    assert "tests/test_sample.py" in qlist
