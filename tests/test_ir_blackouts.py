from ir import blackouts


def test_blackouts_status():
    assert blackouts.status("2025-09-12") == "IR_BLACKOUT_BLOCK"
    assert blackouts.status("2025-10-01") == "OPEN"
