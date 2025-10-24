import json, os
from plm import eco

def test_policy_dual_approval(monkeypatch, tmp_path):
    monkeypatch.setattr(eco, 'ART_DIR', str(tmp_path))
    ch = eco.create_change('X', 'A', 'B', 'update')
    path = eco._path(ch.id)
    with open(path) as f:
        data = json.load(f)
    data['risk'] = 'high'
    data['approvals'] = []
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    flag = os.path.join('artifacts','mfg','spc','blocking.flag')
    if os.path.exists(flag):
        os.remove(flag)
    try:
        eco.release(ch.id)
    except SystemExit as e:
        assert 'dual approval' in str(e)
    else:
        assert False, 'expected dual approval policy'
    data['approvals'] = ['QA','ENG']
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    eco.release(ch.id)
    with open(path) as f:
        out = json.load(f)
    assert out['status'] == 'released'
