from pathlib import Path
import json

from mdm import domains, match, survivorship, quality, changes


def setup_account():
    domains.stage('account', Path('fixtures/mdm/account.csv'))
    match.match('account', Path('configs/mdm/match_account.yaml'))
    survivorship.merge('account', Path('configs/mdm/survivorship_account.yaml'))
    quality.dq('account', Path('configs/mdm/dq_account.yaml'))


def test_change_lifecycle(tmp_path: Path):
    setup_account()
    payload = tmp_path / 'p.json'
    payload.write_text('{}')
    chg = changes.new('account', 'merge', payload)
    assert chg.status == 'draft'
    changes.approve(chg.id, 'U_DATA_STEWARD')
    applied = changes.apply(chg.id)
    assert applied.status == 'applied'
