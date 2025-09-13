import json

from orchestrator.env_stamp import create_env_stamp


def test_env_stamp_fields(tmp_path):
    path = create_env_stamp(tmp_path / "env.json")
    data = json.loads(path.read_text())
    assert "python" in data
    assert "platform" in data
    assert "dependency_hash" in data
    assert "settings_digest" in data
    assert "random_seed" in data
