from close import journal, recon
from close.calendar import CloseCalendar


def test_run_recons(tmp_path):
    period = "2025-09"
    tb = journal.load_tb(period)
    jnls = journal.propose_journals(tb, "configs/close/journals/accruals.yaml")
    adj = journal.post(period, tb, jnls)
    results = recon.run_recons(period, adj, "configs/close/recons.yaml", "fixtures/finance/recons")
    assert all(r.status == "match" for r in results)
