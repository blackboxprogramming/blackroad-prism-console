import json
import shutil
import pytest
from close import calendar


def setup_module(module):
    shutil.rmtree('artifacts/close/2025-09', ignore_errors=True)


def test_calendar_flow():
    cal = calendar.CloseCalendar.from_template('2025-09', 'configs/close/template.yaml')
    cal.save()
    assert cal.topo_order() == ['REVENUE-CUT', 'BANK-REC']
    cal.update('REVENUE-CUT', status='done', evidence='artifacts/close/REV/cut.md')
    with pytest.raises(ValueError):
        cal.update('BANK-REC', status='done')
    cal.update('BANK-REC', status='done', evidence='artifacts/close/REV/cut.md')
    flags = cal.sla_flags('2025-09-10')
    assert flags == []
    data = json.loads(open('artifacts/close/2025-09/calendar.json').read())
    assert len(data) == 2
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
