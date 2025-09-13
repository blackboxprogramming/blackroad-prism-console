from pathlib import Path

from sales import catalog, cpq, deal_desk


def setup_module(_):
    catalog.load(Path('configs/sales'))


def test_deal_flow(tmp_path):
    lines = [{"sku": "F500-CORE", "qty": 1, "options": {}}]
    cfg = cpq.configure(lines)
    quote = cpq.price(cfg, "NA", "USD")
    qpath = tmp_path / "q.json"
    cpq.save_quote(quote, qpath)
    deal = deal_desk.new_deal("ACME", qpath, 20)
    codes = deal_desk.check_deal(deal)
    assert "DISC_OVER_MAX" in codes
    deal_desk.request_approval(deal, "CFO")
    loaded = deal_desk.load_deal(deal.id)
    assert loaded.approvals[0]["role"] == "CFO"
