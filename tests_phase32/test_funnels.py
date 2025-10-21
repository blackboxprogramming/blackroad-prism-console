from growth import funnels


def test_funnel_build():
    res = funnels.build([
        "signup",
        "activation",
        "paywall",
        "purchase",
    ], "2025-07-01T00:00:00", "2025-07-05T00:00:00")
    assert res["counts"][0] == 2
    assert res["dropoff"][1] == 0
