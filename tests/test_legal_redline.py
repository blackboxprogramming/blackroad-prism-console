from legal import redline
from pathlib import Path


def test_diff_and_score(tmp_path):
    old = tmp_path / "old.md"
    new = tmp_path / "new.md"
    old.write_text("A\nB CLAUSE_LIAB\n")
    new.write_text("A\nB changed CLAUSE_LIAB\n")
    diff = redline.write_redline(str(old), str(new), str(tmp_path / "out"))
    assert diff["changed"]
    score = redline.risk_score(diff, {"CLAUSE_LIAB": {"risk": "high"}})
    assert score == 100
