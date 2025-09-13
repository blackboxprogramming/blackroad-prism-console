from datetime import datetime

from bots.sre_bot import SREBot
from orchestrator import flags
from orchestrator.protocols import Task


def test_sre_bot_flag(tmp_path, monkeypatch):
    flags.set_flag("bot.SRE-BOT.postmortem_v2", False)
    bot = SREBot()
    task = Task(id="T1", goal="pm", context=None, created_at=datetime.utcnow())
    assert "v1" in bot.run(task).summary
    flags.set_flag("bot.SRE-BOT.postmortem_v2", True)
    assert "v2" in bot.run(task).summary


def test_list_flags_has_scopes():
    data = flags.list_flags()
    assert "bot" in data and "global" in data
