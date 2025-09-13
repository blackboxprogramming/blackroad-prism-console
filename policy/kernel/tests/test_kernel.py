from policy.kernel.kernel import PolicyKernel


def test_closed_won_allow():
    pk = PolicyKernel()
    env = {
        "source": "salesforce",
        "type": "salesforce.opportunity.closed_won",
        "payload": {"opportunity": {"amount": 100000}}
    }
    result = pk.evaluate(env)
    assert result["decision"] == "ALLOW"


def test_closed_won_review_large_amount():
    pk = PolicyKernel()
    env = {
        "source": "salesforce",
        "type": "salesforce.opportunity.closed_won",
        "payload": {"opportunity": {"amount": 2_000_000}}
    }
    result = pk.evaluate(env)
    assert result["decision"] == "REVIEW"


def test_global_kill_switch():
    pk = PolicyKernel()
    pk.set_kill_switch(True)
    env = {"source": "salesforce", "type": "salesforce.opportunity.closed_won", "payload": {}}
    result = pk.evaluate(env)
    assert result["decision"] == "DENY"
