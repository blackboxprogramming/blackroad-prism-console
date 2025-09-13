from strategy import scorecard, okr, utils


def setup_tmp(tmp_path):
    utils.ARTIFACTS = tmp_path
    utils.LAKE = tmp_path / "lake"


def test_scorecard(tmp_path):
    setup_tmp(tmp_path)
    obj = okr.new_objective("org", "Product", "2025Q4", "Ship")
    okr.new_key_result(obj.id, "Ship", 1, "count", "binary")
    sc = scorecard.build("2025Q4", "org", "Product")
    assert sc.objectives
