from legal import clm
import pytest


def test_state_transitions(tmp_path, monkeypatch):
    # ensure artifacts under tmp
    monkeypatch.setattr(clm, "ART_DIR", tmp_path)
    clm.LOG = tmp_path / "contracts.jsonl"
    clm.SEQ_FILE = tmp_path / "contract_seq.txt"

    c = clm.create("MSA", "Acme")
    assert c.status == "draft"
    clm.route_for_review(c.id, "LEGAL")
    clm.approve(c.id, "U_LEGAL")
    with pytest.raises(RuntimeError):
        clm.execute(c.id, "2025-10-01")
    clm.esign(c.id, "U_LEGAL", "ok")
    clm.execute(c.id, "2025-10-01")
    final = clm.load_contract(c.id)
    assert final.status == "executed"
