from pathlib import Path

from mdm import domains, match


def test_match_clusters_two_records():
    domains.stage('account', Path('fixtures/mdm/account.csv'))
    clusters = match.match('account', Path('configs/mdm/match_account.yaml'))
    assert len(clusters) == 1
    assert clusters[0]['members'] == [0,1]
