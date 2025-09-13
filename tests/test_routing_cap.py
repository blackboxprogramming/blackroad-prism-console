from plm import bom
from mfg import routing


def setup_module(module):
    bom.load_items('fixtures/plm/items')
    bom.load_boms('fixtures/plm/boms')
    routing.load_work_centers('fixtures/mfg/work_centers.csv')
    routing.load_routings('fixtures/mfg/routings')


def test_capacity_and_cost():
    res = routing.capacity_check('PROD-100', 'B', 100)
    assert round(res['WC-1']['required_min'], 2) == 526.32
    assert round(res['labor_cost'], 2) == 467.24
