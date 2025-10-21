from experiments import rollout


def test_gate_ok_and_block():
    assert rollout.gate("paywall_v2", 5) == "OK"
    assert rollout.gate("missing_feature", 5).startswith("BLOCK")
