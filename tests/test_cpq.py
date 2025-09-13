from pathlib import Path

from sales import catalog, cpq


def setup_module(_):
    catalog.load(Path('configs/sales'))


def test_tiering_and_bundle(tmp_path):
    lines = [{"sku": "F500-CORE", "qty": 50, "options": {"bundle": True}}]
    cfg = cpq.configure(lines)
    quote = cpq.price(cfg, "NA", "USD", policies={"bundle_discount_pct": 10})
    assert quote.lines[0].unit_price == 72.0  # 80 tier with 10% bundle
    out = tmp_path / "quote.json"
    cpq.save_quote(quote, out)
    assert out.exists()
    assert out.with_suffix('.md').exists()
