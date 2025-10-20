from pathlib import Path
import json

from mdm import domains


def test_stage_normalizes(tmp_path: Path):
    file = Path('fixtures/mdm/account.csv')
    staged = domains.stage('account', file)
    out_file = Path('artifacts/mdm/staged/account.json')
    data = json.loads(out_file.read_text())
    assert data['rows'][0]['name'] == 'acme corp'
    assert data['rows'][0]['phone'] == '555111'
