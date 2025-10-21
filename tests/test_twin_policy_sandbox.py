from twin import policy_sandbox


def test_policy_sandbox():
    assert policy_sandbox.ACTIVE_PACKS == []
    with policy_sandbox.with_packs(["pack1"]):
        assert policy_sandbox.ACTIVE_PACKS == ["pack1"]
    assert policy_sandbox.ACTIVE_PACKS == []
from twin.policy_sandbox import get_active_packs, with_packs


def test_policy_context():
    assert get_active_packs() == []
    with with_packs(["a", "b"]):
        assert get_active_packs() == ["a", "b"]
    assert get_active_packs() == []
