from growth import loops


def test_growth_sim():
    res = loops.simulate(4, "configs/growth/loops.yaml")
    assert res["WAU"][-1] == 14
