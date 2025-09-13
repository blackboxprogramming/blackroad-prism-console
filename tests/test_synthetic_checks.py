from healthchecks.synthetic import run_checks, summary


def test_run_checks_deterministic():
    first = run_checks("CoreAPI")
    second = run_checks("CoreAPI")
    assert first[0]["latency_ms"] == second[0]["latency_ms"]
    data = summary("CoreAPI")
    assert data["service"] == "CoreAPI"
