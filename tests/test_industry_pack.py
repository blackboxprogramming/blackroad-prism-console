from bots import BOT_REGISTRY
from orchestrator import Task


def test_merchandising_bot():
    bot = BOT_REGISTRY["Merchandising-BOT"]
    result = bot.run(Task(id="1", goal="plan", bot="Merchandising-BOT"))
    assert "SKU1" in result


def test_store_ops_bot():
    bot = BOT_REGISTRY["Store-Ops-BOT"]
    result = bot.run(Task(id="2", goal="ops", bot="Store-Ops-BOT"))
    assert result["labor_plan"]

