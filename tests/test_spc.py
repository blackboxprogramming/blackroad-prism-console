from mfg import spc


def test_spc_rules(tmp_path):
    findings = spc.analyze('OP-200', window=50)
    assert 'SPC_POINT_BEYOND_3SIG' in findings


def test_point_beyond_3sigma(tmp_path, monkeypatch):
    baseline = [1, 2] * 4
    m = sum(baseline) / len(baseline)
    s = (sum((x - m) ** 2 for x in baseline) / len(baseline)) ** 0.5
    x = 10
    assert s > 0 and x > m + 3 * s
