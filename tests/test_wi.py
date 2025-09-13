import pytest
from plm import bom
from mfg import routing, work_instructions


def setup_module(module):
    bom.load_items('fixtures/plm/items')
    bom.load_boms('fixtures/plm/boms')
    routing.load_work_centers('fixtures/mfg/work_centers.csv')
    routing.load_routings('fixtures/mfg/routings')


def test_render_creates_file():
    path = work_instructions.render('PROD-100', 'B')
    assert path.exists()


def test_revision_mismatch():
    bom.BOMS.pop(('PROD-100', 'B'))
    with pytest.raises(RuntimeError):
        work_instructions.render('PROD-100', 'B')
