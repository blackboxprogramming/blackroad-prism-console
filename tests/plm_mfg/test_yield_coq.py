import importlib, os
from mfg import coq
yld = importlib.import_module('mfg.yield')

def test_yield_coq(tmp_path, monkeypatch):
    yd = tmp_path/'yield'
    cq = tmp_path/'coq'
    monkeypatch.setattr(yld, 'ART_DIR', str(yd))
    monkeypatch.setattr(coq, 'ART_DIR', str(cq))
    os.makedirs(yld.ART_DIR, exist_ok=True)
    os.makedirs(coq.ART_DIR, exist_ok=True)
    yld.compute('2025-09')
    coq.compute('2025-Q3')
    assert os.path.exists(os.path.join(yld.ART_DIR,'summary.md'))
    assert os.path.exists(os.path.join(coq.ART_DIR,'coq.csv'))
