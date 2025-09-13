from pathlib import Path

from strategy import reviews, utils


def setup_tmp(tmp_path):
    utils.ARTIFACTS = tmp_path
    utils.LAKE = tmp_path / "lake"


def test_review(tmp_path, monkeypatch):
    setup_tmp(tmp_path)
    cfg = tmp_path / "rhythm.yaml"
    cfg.write_text("weekly:\n  - test\n")
    monkeypatch.setattr(reviews, "CFG_PATH", cfg)
    reviews.prepare("2025-10-03")
    (tmp_path / "review_2025-10-03" / "CFO.approved").write_text("ok")
    (tmp_path / "review_2025-10-03" / "COO.approved").write_text("ok")
    reviews.packet("2025-10-03")
