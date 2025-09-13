from bots.finance import FinanceBot
from orchestrator.protocols import Task


def test_finance_bot_run():
    bot = FinanceBot()
    task = Task(id="1", description="Treasury cash flow", domain="finance")
    response = bot.run(task)
    assert response.status == "success"
