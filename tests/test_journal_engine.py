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
