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
