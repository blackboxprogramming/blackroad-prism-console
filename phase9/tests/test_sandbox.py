import time
import pytest

from sdk import plugin_api
from orchestrator import route
from orchestrator.sandbox import BotExecutionError


class SlowBot(plugin_api.BaseBot):
    NAME = "Slow-BOT"

    def handle(self, task: plugin_api.Task) -> plugin_api.BotResponse:
        time.sleep(10)
        return plugin_api.BotResponse(ok=True)


plugin_api.register_plugin_bot(SlowBot)


def test_timeout():
    plugin_api.get_settings().EXECUTION_MODE = "sandbox"
    task = plugin_api.Task(intent="slow")
    with pytest.raises(BotExecutionError):
        route("Slow-BOT", task)
    plugin_api.get_settings().EXECUTION_MODE = "inproc"
