from mfg import spc

def test_stdev_and_rules():
    xs = [1.0]*7 + [5.0]
    m = spc._mean(xs)
    s = spc._stdev(xs)
    assert s > 0 and (xs[-1] > m + 3*s) is False
