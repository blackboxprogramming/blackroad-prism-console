from datetime import date
from legal import clm, obligations


def test_extract_and_list(tmp_path, monkeypatch):
    monkeypatch.setattr(clm, "ART_DIR", tmp_path)
    clm.LOG = tmp_path / "contracts.jsonl"
    clm.SEQ_FILE = tmp_path / "contract_seq.txt"
    contract = clm.create("MSA", "Acme")
    clm.add_obligation(contract.id, "Delete data", "2025-11-01")
    obligations.ART_DIR = tmp_path
    obligations.OBLIG_PATH = tmp_path / "obligations.json"
    obs = obligations.extract(contract.id)
    assert obs
    upcoming = obligations.list_obligations(90, today=date(2025,9,1))
    assert upcoming
