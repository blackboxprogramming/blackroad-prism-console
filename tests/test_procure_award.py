from procure.optimizer import Supplier, choose_mix


def test_procure_award():
    demand = {"sku": 150}
    suppliers = [
        Supplier("S1", "sku", 5.0, 50, 10, 100),
        Supplier("S2", "sku", 6.0, 30, 8, 50),
    ]
    policy = {"dual_source_min_pct": 0.2, "max_supplier_count": 2}
    award = choose_mix(demand, suppliers, policy)
    assert len(award["awards"]) >= 1
    assert award["tco"] > 0
