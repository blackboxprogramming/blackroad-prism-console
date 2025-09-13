from finance.wc import cash_cycle


def test_cash_cycle():
    demand = [{"units": 100}]
    awards = [{"units": 100, "unit_price": 5}]
    plan = {"plan": []}
    terms = {"DSO": 30, "DPO": 45, "inventory_days": 20}
    res = cash_cycle(demand, awards, plan, terms)
    assert res["CCC"] == 5
    assert len(res["cash_curve"]) == 1
