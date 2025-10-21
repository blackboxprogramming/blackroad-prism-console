from pathlib import Path
import ir.disclosures as disclosures
from ir import utils


def test_disclosure_logged(monkeypatch, tmp_path):
    monkeypatch.setattr(disclosures, "IR_ARTIFACTS", tmp_path)
    monkeypatch.setattr(utils, "METRICS_PATH", tmp_path / "m.jsonl")
    p = tmp_path / "doc.md"
    p.write_text("hello")
    disclosures.log_disclosure("press", str(p), "U_IR")
    ledger = (tmp_path / "disclosures.jsonl").read_text()
    assert "content_hash" in ledger
import json
from pathlib import Path
from ir import disclosures


def test_disclosure_logged(tmp_path):
    if disclosures.LEDGER.exists():
        disclosures.LEDGER.unlink()
    f = tmp_path / "note.txt"
    f.write_text("hi")
    disclosures.log_file("press", str(f), "U_IR")
    rec = json.loads(disclosures.LEDGER.read_text().strip().splitlines()[-1])
    assert rec["channel"] == "press"
