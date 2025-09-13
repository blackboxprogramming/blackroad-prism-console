import board.pack as pack
from ir import utils


def test_board_pack(monkeypatch, tmp_path):
    monkeypatch.setattr(pack, "BOARD_ARTIFACTS", tmp_path)
    monkeypatch.setattr(utils, "METRICS_PATH", tmp_path / "m.jsonl")
    pack.build("2025-09")
    out = tmp_path / "pack_202509"
    assert (out / "index.md").exists()
    assert (out / "kpi_table.md").exists()
