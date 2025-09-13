from pathlib import Path
from datetime import datetime

from sales import catalog, cpq, deal_desk, winloss


def setup_module(_):
    catalog.load(Path('configs/sales'))


def _make_deal(status: str):
    lines = [{"sku": "F500-CORE", "qty": 1, "options": {}}]
    cfg = cpq.configure(lines)
    quote = cpq.price(cfg, "NA", "USD")
    qpath = Path('artifacts/tmp_quote.json')
    cpq.save_quote(quote, qpath)
    deal = deal_desk.new_deal("AC", qpath, 0)
    deal.status = status
    deal_desk.save_deal(deal)


def test_winloss_report():
    deals_dir = Path('artifacts/sales/deals')
    if deals_dir.exists():
        for f in deals_dir.glob('*.json'):
            f.unlink()
    _make_deal('won')
    _make_deal('lost')
    start = datetime(2025, 6, 1)
    end = datetime(2025, 9, 30)
    path = winloss.build_report(start, end)
    text = Path(path).read_text()
    assert "Wins: 1" in text
    assert "Losses: 1" in text
