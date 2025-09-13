import pytest

from sop.plan import DemandSignal, SupplyPlan, reconcile


def test_reconcile_basic():
    demand = [
        DemandSignal("2024-01-01", "sku", "NA", 100),
        DemandSignal("2024-01-01", "sku", "EU", 80),
    ]
    supply = [SupplyPlan("2024-01-01", "sku", "siteA", 150)]
    policy = {"allocation_rule": ["NA", "EU"], "backorder_allowed": True}
    result = reconcile(demand, supply, policy)
    assert result["service_level"] == pytest.approx(150 / 180, rel=1e-3)
    assert result["capacity_util"] == 1.0
    assert sum(a["units"] for a in result["allocations"]) == 150
