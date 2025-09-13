from pathlib import Path
from people import headcount


def test_forecast(tmp_path: Path):
    plans = Path('fixtures/people/plans.csv')
    attr = Path('fixtures/people/attrition.csv')
    transfers = Path('fixtures/people/transfers.csv')
    policy = Path('configs/people/hc_policy.yaml')
    plan, summary = headcount.forecast(plans, attr, transfers, policy)
    assert summary['planned'] == 2
    assert summary['projected'] == 2
    assert plan[0]['projected_start'] == '2025-01-31'
    out_dir = tmp_path / 'out'
    headcount.write_artifacts(out_dir, plan, summary)
    assert (out_dir / 'plan.json').exists()
