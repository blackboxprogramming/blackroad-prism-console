import json
from pathlib import Path

from orchestrator.env_stamp import create_env_stamp


def test_env_stamp_fields(tmp_path):
    path = create_env_stamp(tmp_path)
    data = json.loads(Path(path).read_text())
    for key in ["python", "platform", "dependency_hash", "settings_digest", "random_seed"]:
        assert key in data
