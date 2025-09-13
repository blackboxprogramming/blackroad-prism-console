from pathlib import Path

from mdm import domains, match, survivorship, quality


def setup_account():
    domains.stage('account', Path('fixtures/mdm/account.csv'))
    match.match('account', Path('configs/mdm/match_account.yaml'))
    survivorship.merge('account', Path('configs/mdm/survivorship_account.yaml'))


def setup_contact():
    domains.stage('contact', Path('fixtures/mdm/contact.csv'))
    match.match('contact', Path('configs/mdm/match_contact.yaml'))
    survivorship.merge('contact', Path('configs/mdm/survivorship_contact.yaml'))


def test_dq_account_clean():
    setup_account()
    res = quality.dq('account', Path('configs/mdm/dq_account.yaml'))
    assert all(len(c['violations']) == 0 for c in res['checks'])


def test_dq_contact_violation():
    setup_contact()
    res = quality.dq('contact', Path('configs/mdm/dq_contact.yaml'))
    assert any(c['violations'] for c in res['checks'])
