from pathlib import Path
import json

from mdm import domains, match, survivorship


def test_survivorship_picks_preferred_source():
    domains.stage('account', Path('fixtures/mdm/account.csv'))
    match.match('account', Path('configs/mdm/match_account.yaml'))
    golden = survivorship.merge('account', Path('configs/mdm/survivorship_account.yaml'))
    assert golden[0]['source'] == 'crm'
    assert len(golden) == 1
