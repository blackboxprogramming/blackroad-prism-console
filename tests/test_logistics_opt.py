from supply.logistics import Lane, optimize_lanes


def test_logistics_plan():
    demand = [{"region": "NA", "units": 100}, {"region": "EU", "units": 80}]
    lanes = [
        Lane("siteA", "NA", "sea", 1.0, 0.1, 7),
        Lane("siteA", "NA", "air", 3.0, 0.2, 2),
        Lane("siteA", "EU", "sea", 1.2, 0.1, 8),
        Lane("siteA", "EU", "air", 3.5, 0.2, 3),
    ]
    constraints = {"max_air_pct": 0.5, "budget_cap": 1000, "sla_days": 7, "sla_target": 0.9}
    plan = optimize_lanes(demand, lanes, constraints)
    assert plan["total_cost"] > 0
    assert plan["sla_hit_pct"] <= 1
