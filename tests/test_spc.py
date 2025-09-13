from mfg import spc

def test_basic_stats():
    xs = [1,1,1,1,1,1,1,5]
    assert spc._mean(xs) > 0
    assert spc._stdev(xs) >= 0
