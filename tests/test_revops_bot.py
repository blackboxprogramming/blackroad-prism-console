from bots.revops_bot import RevOpsBot
from orchestrator.base import Task


def test_forecast_accuracy():
    bot = RevOpsBot()
    task = Task(id="1", goal="Check forecast accuracy for Q3")
    resp = bot.run(task)
    assert "RevOps-BOT" in resp.summary
    assert resp.artifacts["avg_error"] == 6.67
    assert resp.risks


def test_pipeline_hygiene():
    bot = RevOpsBot()
    task = Task(id="2", goal="Pipeline hygiene report")
    resp = bot.run(task)
    assert "pipeline hygiene" in resp.summary.lower()
    assert resp.risks
