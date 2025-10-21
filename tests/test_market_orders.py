from pathlib import Path

from partners import catalog, orders
from licensing import entitlements

CONFIG_DIR = Path("configs/partners")


def test_order_and_provision(tmp_path):
    # clean artifacts
    ent_path = entitlements.ARTIFACTS  # type: ignore
    if Path(ent_path).exists():
        Path(ent_path).unlink()
    ord_path = orders.ART  # type: ignore
    if Path(ord_path).exists():
        Path(ord_path).unlink()
    catalog.load_catalog(CONFIG_DIR)
    # add dependency entitlement
    entitlements.add_entitlement("ACME", "F500-CORE", 1, "2025-01-01", "2025-12-31")
    order = orders.place_order("ACME", "L-PRICING-PACK", 1)
    assert order.status == "pending"
    prov = orders.provision(order.id)
    assert prov.status == "provisioned"
    res = entitlements.resolve("ACME", on="2025-06-01")
    assert "pro" in res["features"]
