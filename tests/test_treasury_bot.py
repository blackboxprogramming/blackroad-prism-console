from bots.treasury_bot import TreasuryBot
from orchestrator.protocols import Task


def test_treasury_bot_response():
    bot = TreasuryBot()
    task = Task(id="T2", goal="cash forecast", context={})
    resp = bot.run(task)
    assert resp.summary
    assert resp.steps
    assert resp.risks_gaps
    assert resp.next_actions
