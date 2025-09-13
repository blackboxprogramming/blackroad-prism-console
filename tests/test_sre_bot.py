from bots.sre_bot import SREBot
from orchestrator.base import Task


def test_error_budget():
    bot = SREBot()
    task = Task(id="1", goal="Compute error-budget burn for Service A")
    resp = bot.run(task)
    assert "SRE-BOT" in resp.summary
    assert resp.artifacts["burn_minutes"] == 45
    assert resp.risks


def test_postmortem():
    bot = SREBot()
    task = Task(id="2", goal="Postmortem skeleton", context={"incident_id": "inc1", "timeline": ["t0", "t1"]})
    resp = bot.run(task)
    assert "postmortem" in resp.summary.lower()
    assert resp.artifacts["incident_id"] == "inc1"
    assert resp.risks
