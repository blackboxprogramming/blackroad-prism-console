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
