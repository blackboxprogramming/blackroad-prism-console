from strategy import memos, utils


def setup_tmp(tmp_path):
    utils.ARTIFACTS = tmp_path
    utils.LAKE = tmp_path / "lake"


def test_memo(tmp_path):
    setup_tmp(tmp_path)
    m = memos.build("2025Q4", "APAC")
    assert "Context" in m.body
