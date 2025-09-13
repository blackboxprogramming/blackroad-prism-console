from pathlib import Path
import json
import pytest

from sales import quote_pack


def test_pack_build(tmp_path):
    quote = {"lines": [], "total": 0}
    qpath = tmp_path / "quote.json"
    qpath.write_text(json.dumps(quote))
    out = tmp_path / "pack"
    quote_pack.build_pack(qpath, "ACME-001", out)
    assert (out / "cover.md").exists()
    assert (out / "pricing_table.md").exists()


def test_privacy_gate(tmp_path, monkeypatch):
    quote = {"lines": [], "total": 0, "contacts": [{"name": "Bob"}]}
    qpath = tmp_path / "quote.json"
    qpath.write_text(json.dumps(quote))
    with pytest.raises(ValueError):
        quote_pack.build_pack(qpath, "ACME", tmp_path / "pack2")
