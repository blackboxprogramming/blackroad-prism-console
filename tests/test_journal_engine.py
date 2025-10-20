import pytest
import shutil
from close import journal


def setup_module(module):
    shutil.rmtree('artifacts/close/2025-09', ignore_errors=True)


def test_journal_posting_balances():
    journals = journal.propose_journals('2025-09', 'configs/close/journals/accruals.yaml')
    assert len(journals) == 1
    adjusted = journal.post('2025-09', journals)
    accounts = {r['account']: r['amount'] for r in adjusted if r['drcr'] == 'dr'}
    assert accounts['3000'] == 100.0


def test_unbalanced_journal_blocked():
    bad = [journal.Journal(id='BAD', lines=[journal.JournalLine(account='9999', drcr='dr', amount=1.0)])]
    with pytest.raises(ValueError):
        journal.post('2025-09', bad)
from pathlib import Path
from close import journal

def test_propose_and_post(tmp_path):
    period = "2025-09"
    tb = journal.load_tb(period)
    jnls = journal.propose_journals(tb, "configs/close/journals/accruals.yaml")
    assert jnls and jnls[0].is_balanced()
    adj = journal.post(period, tb, jnls)
    assert abs(adj["1000"] - 900) < 0.01
    csv_path = Path("artifacts/close") / period / "adjusted_tb.csv"
    assert csv_path.exists()


def test_unbalanced_journal(tmp_path):
    tb = {"1000": 0.0}
    bad = journal.Journal(id="bad", lines=[journal.JournalLine(account="1000", amount=1, drcr="dr")])
    with pytest.raises(ValueError):
        journal.post("p", tb, [bad])
