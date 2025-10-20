import pytest
from strategy import utils


def setup_tmp(tmp_path):
    utils.ARTIFACTS = tmp_path
    utils.LAKE = tmp_path / "lake"


def test_contracts(tmp_path):
    setup_tmp(tmp_path)
    utils.validate_and_write("bets", {"id": "B1", "period": "p"})
    with pytest.raises(ValueError):
        utils.validate_and_write("bets", {"id": "B1"})
