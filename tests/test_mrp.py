from mfg import mrp
import os, json

def test_mrp_plan(tmp_path, monkeypatch):
    d = tmp_path
    dem = d/'demand.csv'; dem.write_text('item_id,qty\nA,10\nB,2\n')
    inv = d/'inv.csv'; inv.write_text('item_id,qty\nA,8\n')
    pos = d/'pos.csv'; pos.write_text('item_id,qty_open\nB,2\n')
    monkeypatch.setattr(mrp, 'ART_DIR', str(d/'mrp'))
    out = mrp.plan(str(dem), str(inv), str(pos))
    assert 'A' in out and out['A']['planned_qty'] == 2
    assert 'B' not in out
    assert os.path.exists(os.path.join(mrp.ART_DIR, 'plan.json'))
