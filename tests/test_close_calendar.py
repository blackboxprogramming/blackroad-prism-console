import pytest
from pathlib import Path
from close.calendar import CloseCalendar
from close import sox

def test_calendar_update_requires_evidence(tmp_path):
    period = "2025-09"
    cal = CloseCalendar.from_template(period, "configs/close/template.yaml")
    cal.save()
    with pytest.raises(ValueError):
        cal.update_task("REV-CUT", status="done")
    ev_path = tmp_path / "cut.md"
    ev_path.write_text("cut")
    sox.add(period, "C-REV-01", str(ev_path), "tester")
    cal.update_task("REV-CUT", status="done", evidence=str(ev_path))
    cal.save()
    status_file = Path("artifacts/close") / period / "status.md"
    assert status_file.exists()
    content = status_file.read_text().strip().split("\n")
    assert any("REV-CUT" in line and "done" in line for line in content)
