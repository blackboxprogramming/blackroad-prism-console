from plm import bom
from mfg import mrp


def setup_module(module):
    bom.load_items('fixtures/plm/items')
    bom.load_boms('fixtures/plm/boms')


def test_mrp_plan(tmp_path):
    plan = mrp.plan('fixtures/mfg/demand.csv', 'fixtures/mfg/inventory.csv', 'fixtures/mfg/open_pos.csv')
    assert plan['PROD-100'] == 90
    assert plan['COMP-2'] == 360
    assert plan['RAW-1'] == 94.5
