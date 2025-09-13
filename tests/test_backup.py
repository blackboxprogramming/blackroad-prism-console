from __future__ import annotations

from pathlib import Path

from tools import backup


def test_snapshot_and_restore(tmp_path):
    data_dir = Path("data")
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "file.txt").write_text("orig", encoding="utf-8")

    dest = tmp_path / "snap"
    backup.snapshot(dest)

    (data_dir / "file.txt").write_text("mutated", encoding="utf-8")
    backup.restore(dest)

    assert (data_dir / "file.txt").read_text(encoding="utf-8") == "orig"
