from pathlib import Path

from licensing import entitlements
from billing import invoices


def test_run_and_show(tmp_path):
    # clean
    ent_path = entitlements.ARTIFACTS  # type: ignore
    if Path(ent_path).exists():
        Path(ent_path).unlink()
    bill_dir = Path(invoices.ART)
    if bill_dir.exists():
        for f in bill_dir.glob("*"):
            f.unlink()
    entitlements.add_entitlement("ACME", "F500-PRO", 2, "2025-01-01", "2025-12-31")
    invs = invoices.run("2025-09")
    assert invs and invs[0].total > 0
    show = invoices.show(invs[0].invoice_id)
    assert show["tenant"] == "ACME"
