import os
from pathlib import Path

from security import esign


def test_sign_and_verify(tmp_path, monkeypatch):
    key_file = tmp_path / "keys.json"
    monkeypatch.setenv("ESIGN_KEY_FILE", str(key_file))
    esign.keygen("U_PM")
    data = esign.sign_statement("U_PM", "Approved")
    assert esign.verify_statement(data["signature"], "U_PM", "Approved")
