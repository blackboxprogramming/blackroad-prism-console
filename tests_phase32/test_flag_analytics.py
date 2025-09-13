from experiments import flag_analytics


def test_flag_impact():
    res = flag_analytics.impact("paywall_v2", 14)
    assert round(res["diff"], 1) == 50.0
