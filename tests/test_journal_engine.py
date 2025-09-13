import pytest
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
