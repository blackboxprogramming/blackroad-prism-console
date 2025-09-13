from legal import clm, data_room
from pathlib import Path


def test_dataroom(tmp_path, monkeypatch):
    # setup contract with doc
    monkeypatch.setattr(clm, "ART_DIR", tmp_path)
    clm.LOG = tmp_path / "contracts.jsonl"
    clm.SEQ_FILE = tmp_path / "contract_seq.txt"
    c = clm.create("MSA", "Acme")
    doc = tmp_path / f"{c.id}_v1.md"
    doc.write_text("example")
    clm.add_version(c.id, str(doc))
    clm.approve(c.id, "U_LEGAL")
    clm.esign(c.id, "U_LEGAL", "ok")
    clm.execute(c.id, "2025-10-01")
    data_room.ART_DIR = tmp_path / "data_room"
    manifest = data_room.build(["contracts"])
    assert manifest and Path(data_room.ART_DIR / doc.name).exists()
