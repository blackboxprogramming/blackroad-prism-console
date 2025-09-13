from aiops import maintenance


def test_next_window_selection():
    calendar = [
        {"service": "CoreAPI", "action": "remediate", "start": "2024-01-02T00:00:00", "end": "2024-01-02T01:00:00", "reason": "patch"},
        {"service": "CoreAPI", "action": "remediate", "start": "2024-01-01T00:00:00", "end": "2024-01-01T01:00:00", "reason": "nightly"},
    ]
    win = maintenance.next_window("CoreAPI", "remediate", calendar)
    assert win["reason"] == "nightly"
