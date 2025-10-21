from dx import onboard


def test_onboard(tmp_path, monkeypatch):
    monkeypatch.setattr(onboard, "ARTIFACTS", tmp_path)
    ok = onboard.doctor(tmp_path)
    assert ok
    onboard.bootstrap(tmp_path)
    assert (tmp_path / ".venv").exists()
