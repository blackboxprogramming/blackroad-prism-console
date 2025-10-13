from pathlib import Path

from aiops import slo_budget


def test_budget_states(tmp_path: Path):
    data_ok = {"target": 0.99, "errors": 0.002}
    res = slo_budget.budget_status("CoreAPI", "30d", data=data_ok, artifacts_dir=tmp_path)
    assert res["state"] == "ok"
    data_burn = {"target": 0.99, "errors": 0.02}
    res = slo_budget.budget_status("CoreAPI", "30d", data=data_burn, artifacts_dir=tmp_path)
    assert res["state"] == "burning"
