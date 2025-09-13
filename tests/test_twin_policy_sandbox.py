from twin import policy_sandbox


def test_policy_sandbox():
    assert policy_sandbox.ACTIVE_PACKS == []
    with policy_sandbox.with_packs(["pack1"]):
        assert policy_sandbox.ACTIVE_PACKS == ["pack1"]
    assert policy_sandbox.ACTIVE_PACKS == []
