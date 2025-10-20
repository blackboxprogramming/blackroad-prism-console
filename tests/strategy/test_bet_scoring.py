from pathlib import Path

from strategy import bets, utils


def setup_tmp(tmp_path):
    utils.ARTIFACTS = tmp_path
    utils.LAKE = tmp_path / "lake"


def test_bet_ranking(tmp_path, monkeypatch):
    setup_tmp(tmp_path)
    monkeypatch.chdir(tmp_path)
    baseline = Path("fixtures/strategy/okrs_2025Q4.json")
    baseline.parent.mkdir(parents=True, exist_ok=True)
    baseline.write_text("[]")
    cfg = Path("cfg.yaml")
    cfg.write_text("weights:\n  impact: 1\n  cost: 1\n  risk:\n    med: 0\n  speed: 0\n")
    bet = bets.new_bet("prog", "CRO", "2025Q4", 10, 20, "med", 8)
    ranked = bets.rank("2025Q4", cfg)
    assert ranked[0].id == bet.id
