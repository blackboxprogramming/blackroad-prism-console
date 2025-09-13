from pathlib import Path

from orchestrator import migrate


def test_migrations_idempotent(tmp_path, monkeypatch):
    migrate.apply_all()
    assert Path("artifacts/migrated.txt").exists()
    assert Path("artifacts/trace_ids.txt").exists()
    before = migrate.status()
    migrate.apply_all()
    after = migrate.status()
    assert before == after
    assert before is not None
