from pathlib import Path

from dx import test_matrix as tm


def test_matrix(tmp_path, monkeypatch):
    cases = [{"py": "3.11", "ear": True}]
    monkeypatch.setattr(tm, "ARTIFACTS", tmp_path)
    res = tm.run_matrix(cases)
    assert res[0]["result"] == "passed"
    assert (tmp_path / "matrix" / "summary.md").exists()
