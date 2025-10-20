from pathlib import Path

from mdm import domains, match, survivorship, lineage_diff


def test_lineage_diff_adds():
    prev = Path('artifacts/mdm/lineage/prev_account.json')
    if prev.exists():
        prev.unlink()
    domains.stage('account', Path('fixtures/mdm/account.csv'))
    match.match('account', Path('configs/mdm/match_account.yaml'))
    survivorship.merge('account', Path('configs/mdm/survivorship_account.yaml'))
    summary = lineage_diff.diff('account')
    assert summary['adds'] == 1
