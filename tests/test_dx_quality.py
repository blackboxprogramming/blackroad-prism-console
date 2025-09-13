import subprocess

from dx import quality


class DummyRes:
    returncode = 0


def fake_run(cmd, check=True, capture_output=True, text=True):
    if cmd[0] == "pytest":
        return DummyRes()
    raise FileNotFoundError


def test_quality(monkeypatch):
    monkeypatch.setattr(subprocess, "run", fake_run)
    res = quality.run()
    assert res["tests"] == "passed"
    assert res["ruff"] == "skipped"
