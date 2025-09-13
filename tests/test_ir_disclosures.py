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
