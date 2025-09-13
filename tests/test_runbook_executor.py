from runbooks import executor


def test_runbook_ok():
    code = executor.run("runbooks/examples/simple_notify.yaml")
    assert code == "OK"


def test_runbook_gate_fail():
    code = executor.run("runbooks/examples/gate_fail.yaml")
    assert code == "too_low"
