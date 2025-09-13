from orchestrator import health


def test_health_ok():
    result = health.check()
    assert result["overall_status"] == "ok"
