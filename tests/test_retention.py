import os
from datetime import datetime, timedelta
from pathlib import Path

from records import retention
from security import esign


def setup_env(tmp_path, monkeypatch):
    root = tmp_path
    (root / "artifacts").mkdir()
    old_file = root / "artifacts" / "old.txt"
    old_file.write_text("x")
    past = datetime.utcnow() - timedelta(days=40)
    os.utime(old_file, (past.timestamp(), past.timestamp()))
    config = root / "config" / "retention.yaml"
    config.parent.mkdir()
    config.write_text("- type: artifact\n  days: 30\n  legal_hold: false\n")
    monkeypatch.setenv("RETENTION_ROOT", str(root))
    monkeypatch.setenv("RETENTION_CONFIG", str(config))
    mem = root / "mem.jsonl"
    monkeypatch.setenv("RETENTION_MEMORY", str(mem))
    key_file = root / "keys.json"
    monkeypatch.setenv("ESIGN_KEY_FILE", str(key_file))
    esign.keygen("system")
    return old_file, mem


def test_sweep(tmp_path, monkeypatch):
    old_file, mem = setup_env(tmp_path, monkeypatch)
    dry = retention.sweep(dry_run=True)
    assert old_file in dry
    actual = retention.sweep(dry_run=False)
    assert not old_file.exists()
    log = mem.read_text().strip()
    assert "retention_delete" in log
