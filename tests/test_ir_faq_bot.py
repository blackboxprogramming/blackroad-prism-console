from datetime import date

import ir.faq_bot as faq
import ir.kpi_signoff as signoff
import ir.disclosures as disclosures
import ir.blackouts as blackouts
from ir import utils


def test_faq_external_logs_disclosure(monkeypatch, tmp_path):
    for mod in (faq, signoff, disclosures):
        monkeypatch.setattr(mod, "IR_ARTIFACTS", tmp_path)
    monkeypatch.setattr(utils, "METRICS_PATH", tmp_path / "m.jsonl")
    monkeypatch.setattr(faq, "APPROVED_DIRS", [tmp_path])
    monkeypatch.setattr(blackouts, "status", lambda d: None)
    signoff.approve("revenue", "2025Q3", "U_CFO")
    gdir = tmp_path / "guidance_2025Q4"
    gdir.mkdir()
    (gdir / "narrative.md").write_text("Q4 revenue guidance range is 100 to 120.")
    resp = faq.answer("What's Q4 revenue guidance range?", mode="external", today=date(2025, 8, 1), user="U_IR")
    assert "100" in resp["answer"]
    ledger = (tmp_path / "disclosures.jsonl").read_text()
    assert "faq" in ledger
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
