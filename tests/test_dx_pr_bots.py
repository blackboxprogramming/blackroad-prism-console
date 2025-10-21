import json
from pathlib import Path

from dx import pr_runner


def test_pr_runner(tmp_path, monkeypatch):
    spec = tmp_path / "spec.json"
    spec.write_text(json.dumps({"id": "x", "changed_files": ["docs/a.md", "tests/b.py"], "lines_changed": 5}))
    monkeypatch.setattr(pr_runner, "ARTIFACTS", tmp_path)
    res = pr_runner.run(spec)
    assert any(r.name == "Size-BOT" for r in res)
    assert (tmp_path / "pr_reports" / "x.md").exists()
