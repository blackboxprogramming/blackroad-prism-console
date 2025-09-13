import os
from pathlib import Path

from sop import checklist
from security import esign


def setup_keys(tmp_path, monkeypatch):
    key_file = tmp_path / "keys.json"
    monkeypatch.setenv("ESIGN_KEY_FILE", str(key_file))
    esign.keygen("U_PM")


def test_attest_step(tmp_path, monkeypatch):
    monkeypatch.setenv("SOP_ARTIFACTS_DIR", str(tmp_path))
    setup_keys(tmp_path, monkeypatch)
    cl = checklist.load_template("release")
    checklist.save_checklist(cl)
    checklist.attest_step("C001", "U_PM", "Backups verified")
    cl2 = checklist.load_checklist("release")
    assert cl2.steps[0].done is True
    record = Path(tmp_path) / "release" / "C001.json"
    assert record.exists()
