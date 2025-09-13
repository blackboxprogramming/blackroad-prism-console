from twin.policy_sandbox import get_active_packs, with_packs


def test_policy_context():
    assert get_active_packs() == []
    with with_packs(["a", "b"]):
        assert get_active_packs() == ["a", "b"]
    assert get_active_packs() == []
