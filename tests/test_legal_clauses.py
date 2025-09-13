from legal import clauses


def test_assemble(tmp_path, monkeypatch):
    # Use existing configs
    doc, used = clauses.assemble("MSA", "configs/legal/options/acme.yml")
    assert "Confidentiality tight." in doc
    assert any(u["level"] == "tight" for u in used if u["id"] == "CLAUSE_CONF")
