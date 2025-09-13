from plm import bom


def setup_module(module):
    bom.load_items('fixtures/plm/items')
    bom.load_boms('fixtures/plm/boms')


def test_explode_and_where_used(tmp_path):
    parts = bom.explode('PROD-100', 'A', level=3)
    assert any(comp == 'RAW-1' for _, comp, _ in parts)
    used = bom.where_used('COMP-1')
    assert ('PROD-100', 'A') in used
