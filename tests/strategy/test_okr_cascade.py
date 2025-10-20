import json
from pathlib import Path

from strategy import okr, utils


def setup_tmp(tmp_path):
    utils.ARTIFACTS = tmp_path
    utils.LAKE = tmp_path / "lake"


def test_okr_flow(tmp_path):
    setup_tmp(tmp_path)
    obj = okr.new_objective("company", "CEO", "2025Q4", "Win")
    kr = okr.new_key_result(obj.id, "GM%", 36, "pct", "linear")
    okr.link(obj.id, obj.id)
    assert okr.validate("2025Q4")
