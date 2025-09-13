import pytest
from mdm.mdm import require_ids_or_fail


def test_require_ids_ok():
    env = {"account": {"id": "acc-001"}}
    require_ids_or_fail(env, required=["account.id"])


def test_missing_id_raises():
    env = {"account": {}}
    with pytest.raises(ValueError):
        require_ids_or_fail(env, required=["account.id"])
