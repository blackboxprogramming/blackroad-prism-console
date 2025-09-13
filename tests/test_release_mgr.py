from pathlib import Path

from release import manager


def test_stage_and_promote(tmp_path, monkeypatch):
    root = Path("app/data/envs")
    blue = root / "blue"
    blue.mkdir(parents=True, exist_ok=True)
    (blue / "file.txt").write_text("x")
    manager.stage("blue", "green")
    manager.promote("green")
    assert manager.status() == "green"
    cur = Path("app/data/current/file.txt")
    assert cur.read_text() == "x"
