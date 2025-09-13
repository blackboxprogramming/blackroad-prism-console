import importlib

mfg_yield = importlib.import_module('mfg.yield')
from mfg import coq


def test_yield_and_coq(tmp_path):
    stats = mfg_yield.compute('2025-09')
    assert round(stats['fpy'], 3) == 0.95
    totals = coq.build('2025-Q3')
    assert totals['Prevention'] == 100
