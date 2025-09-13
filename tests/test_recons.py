import shutil
from close import journal, recon


def setup_module(module):
    shutil.rmtree('artifacts/close/2025-09', ignore_errors=True)
    j = journal.propose_journals('2025-09', 'configs/close/journals/accruals.yaml')
    journal.post('2025-09', j)


def test_recons_match():
    results = recon.run_recons('2025-09', 'fixtures/finance/recons')
    statuses = {r.account: r.status for r in results}
    assert statuses['1000'] == 'match'
