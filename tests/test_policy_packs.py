from __future__ import annotations

from pathlib import Path

import yaml

from policy import loader


def test_load_and_apply(monkeypatch, tmp_path):
    pack = loader.load_pack('baseline')
    assert pack.name == 'baseline'
    monkeypatch.chdir(tmp_path)
    (tmp_path / 'config').mkdir()
    (tmp_path / 'orchestrator').mkdir()
    loader.apply_pack(pack)
    approvals = yaml.safe_load((tmp_path / 'config/approvals.yaml').read_text())
    assert approvals['logging'] is True
    users = (tmp_path / 'config/users.json').read_text()
    assert 'admin' in users
