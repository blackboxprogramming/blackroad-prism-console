from mfg import spc


def test_spc_rules(tmp_path):
    findings = spc.analyze('OP-200', window=50)
    assert 'SPC_POINT_BEYOND_3SIG' in findings
