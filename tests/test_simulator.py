from __future__ import annotations

from bots.simple import get_default_bots
from simulator.engine import Scenario, run_scenario
from tests.golden import assert_matches_golden


def test_scenarios_run_with_trace_id():
    bots = get_default_bots()
    treas = bots["Treasury-BOT"].run("cash-view", {"accounts": [1, 2, 3]})
    assert_matches_golden("treasury_bot.json", treas)

    revops = bots["RevOps-BOT"].run("forecast", {"pipeline": [1, 2, 3]})
    assert_matches_golden("revops_forecast.json", revops)

    sre = bots["SRE-BOT"].run("error-budget", {"total": 10, "errors": 2})
    assert_matches_golden("sre_error_budget.json", sre)

    scenario = Scenario(
        id="demo",
        name="Demo",
        params={},
        steps=[{"name": "RevOps-BOT", "intent": "forecast", "inputs": {"pipeline": [1]}}],
    )
    result = run_scenario(scenario)
    assert "trace_id" in result
    assert result["steps"][0]["output"] == {"forecast": 1}
