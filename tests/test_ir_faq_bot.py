import json
import os
from ir import faq_bot, guidance, earnings, kpi_sot, kpi_signoff, disclosures


def test_faq_external_logs(tmp_path):
    if disclosures.LEDGER.exists():
        disclosures.LEDGER.unlink()
    kpi_sot.compute("2025Q3")
    kpi_signoff.request_signoff("revenue", "2025Q3")
    kpi_signoff.approve("revenue", "2025Q3", "U_CFO")
    guidance.run("2025Q4", "configs/ir/assumptions.yaml")
    earnings.build("2025Q3", "U_IR")
    os.environ["IR_TODAY"] = "2025-10-10"
    res = faq_bot.answer("What's Q4 revenue guidance range?", "external", "U_IR")
    assert "answer" in res
    rec = json.loads(disclosures.LEDGER.read_text().splitlines()[-1])
    assert rec["channel"] == "faq"
