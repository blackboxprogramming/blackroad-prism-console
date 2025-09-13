import pytest

from orchestrator import quotas


def test_quota_blocks_after_limit(tmp_path, monkeypatch):
    monkeypatch.setattr(quotas, "STATE_DIR", tmp_path)
    quotas.check_and_consume("u", "tasks")
    with pytest.raises(RuntimeError):
        quotas.check_and_consume("u", "tasks")
