from pathlib import Path
import json
import pytest

from plm import bom, eco
from tools import storage


def setup_module(module):
    bom.load_items('fixtures/plm/items')
    bom.load_boms('fixtures/plm/boms')


def test_eco_flow(tmp_path):
    spc_path = Path('artifacts/mfg/spc/findings.json')
    if spc_path.exists():
        spc_path.unlink()
    ch = eco.new_change('PROD-100', 'A', 'B', 'test')
    assert ch.id.startswith('ECO-')
    assert eco.impact(ch.id) == 5.0
    eco.approve(ch.id, 'U_QA')
    eco.release(ch.id)

    ch2 = eco.new_change('PROD-100', 'A', 'B', 'test2')
    eco.approve(ch2.id, 'U_QA')
    spc_dir = Path('artifacts/mfg/spc')
    spc_dir.mkdir(parents=True, exist_ok=True)
    storage.write(str(spc_dir / 'findings.json'), json.dumps(['issue']))
    with pytest.raises(RuntimeError):
        eco.release(ch2.id)
