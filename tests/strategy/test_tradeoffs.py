from pathlib import Path

from strategy import tradeoffs, bets, utils


def setup_tmp(tmp_path):
    utils.ARTIFACTS = tmp_path
    utils.LAKE = tmp_path / "lake"


def test_tradeoff(tmp_path, monkeypatch):
    setup_tmp(tmp_path)
    monkeypatch.chdir(tmp_path)
    baseline = Path("fixtures/strategy/okrs_2025Q4.json")
    baseline.parent.mkdir(parents=True, exist_ok=True)
    baseline.write_text("[]")
    bets.new_bet("b1", "CRO", "2025Q4", 50, 100, "low", 4, theme="security")
    bets.new_bet("b2", "CRO", "2025Q4", 60, 80, "low", 4, theme="growth")
    tradeoffs.select("2025Q4", 100)
    tradeoffs.frontier("2025Q4")
