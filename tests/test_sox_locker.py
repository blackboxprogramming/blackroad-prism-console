import shutil
import pytest
from close import sox


def setup_module(module):
    shutil.rmtree('artifacts/close/2025-09', ignore_errors=True)


def test_sox_evidence():
    sox.add_evidence('2025-09', 'C-REV-01', 'artifacts/close/REV/cut.md', 'tester')
    with pytest.raises(ValueError):
        sox.check_evidence('2025-09')
    sox.add_evidence('2025-09', 'C-BANK-01', 'artifacts/close/REV/cut.md', 'tester')
    sox.check_evidence('2025-09')
from pathlib import Path
from close import sox


def test_evidence_roundtrip(tmp_path):
    period = "2025-09"
    file = tmp_path / "evidence.txt"
    file.write_text("hello")
    ev = sox.add(period, "C-1", str(file), "user")
    listed = sox.list_evidence(period)
    assert any(e.control_id == "C-1" for e in listed)
    missing = sox.check(period, ["C-1", "C-2"])
    assert "C-2" in missing
