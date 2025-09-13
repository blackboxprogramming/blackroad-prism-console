from pathlib import Path

from twin import compare


def test_compare_runs(tmp_path):
    left = tmp_path / "left"
    right = tmp_path / "right"
    left.mkdir()
    right.mkdir()
    (left / "a.txt").write_text("1")
    (right / "a.txt").write_text("2")
    (right / "b.txt").write_text("3")
    result = compare.compare_runs(str(left), str(right))
    assert "a.txt" in result["changed"]
    assert "b.txt" in result["added"]
