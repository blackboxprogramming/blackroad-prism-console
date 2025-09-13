from mfg import work_instructions as wi
import os

def test_wi_paths(tmp_path, monkeypatch):
    monkeypatch.setattr(wi, 'ART_DIR', str(tmp_path))
    wi.render('ITEM','A', None)
    assert os.path.exists(os.path.join(tmp_path,'ITEM_A.md'))
    assert os.path.exists(os.path.join(tmp_path,'ITEM_A.html'))
