import shutil
from pathlib import Path
from close import calendar, journal, recon, flux, sox, packet
from tools import storage
import json
import jsonschema


def setup_module(module):
    shutil.rmtree('artifacts/close/2025-09', ignore_errors=True)


def test_packet_and_signoff():
    cal = calendar.CloseCalendar.from_template('2025-09', 'configs/close/template.yaml')
    cal.save()
    cal.update('REVENUE-CUT', status='done', evidence='artifacts/close/REV/cut.md')
    cal.update('BANK-REC', status='done', evidence='artifacts/close/REV/cut.md')
    j = journal.propose_journals('2025-09', 'configs/close/journals/accruals.yaml')
    journal.post('2025-09', j)
    recon.run_recons('2025-09', 'fixtures/finance/recons')
    flux.run_flux('2025-09', '2025-08', '2024-09', 10.0)
    sox.add_evidence('2025-09', 'C-REV-01', 'artifacts/close/REV/cut.md', 'tester')
    sox.add_evidence('2025-09', 'C-BANK-01', 'artifacts/close/REV/cut.md', 'tester')
    sox.check_evidence('2025-09')
    packet.build_packet('2025-09')
    packet.sign('2025-09', 'CFO', 'U_CFO')
    assert (Path('artifacts/close/2025-09/packet/sign_CFO.json')).exists()
    # contract validations
    tables = [
        ('artifacts/close/2025-09/calendar.json', 'contracts/schemas/close_calendar.json', False),
        ('artifacts/close/2025-09/journals.json', 'contracts/schemas/journals.json', False),
        ('artifacts/close/2025-09/adjusted_tb.json', 'contracts/schemas/trial_balance.json', False),
        ('artifacts/close/2025-09/recons/recons.json', 'contracts/schemas/recons.json', False),
        ('artifacts/close/2025-09/flux/flux.json', 'contracts/schemas/flux_results.json', False),
        ('artifacts/close/2025-09/sox_evidence.jsonl', 'contracts/schemas/sox_evidence.json', True),
    ]
    for file, schema_path, is_jsonl in tables:
        schema = json.loads(storage.read(schema_path))
        content = storage.read(file)
        if is_jsonl:
            for line in content.splitlines():
                jsonschema.validate(json.loads(line), schema)
        else:
            jsonschema.validate(json.loads(content), schema)
from close import packet, journal, recon, flux, sox


def test_packet_and_sign(tmp_path):
    period = "2025-09"
    tb = journal.load_tb(period)
    jnls = journal.propose_journals(tb, "configs/close/journals/accruals.yaml")
    adj = journal.post(period, tb, jnls)
    recon.run_recons(period, adj, "configs/close/recons.yaml", "fixtures/finance/recons")
    flux.run_flux(period, "2025-08", "2024-09", 10.0)
    # add evidence required
    rev_file = tmp_path / "rev.txt"
    rev_file.write_text("rev")
    tb_file = tmp_path / "tb.txt"
    tb_file.write_text("tb")
    sox.add(period, "C-REV-01", str(rev_file), "user")
    sox.add(period, "C-TB-01", str(tb_file), "user")
    packet.build_packet(period)
    sign_path = packet.sign(period, "CFO", "U_CFO")
    assert sign_path.exists()
