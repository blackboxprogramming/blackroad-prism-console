from sdk import plugin_api
from orchestrator import route


class HelloBot(plugin_api.BaseBot):
    NAME = "Hello-BOT"

    def handle(self, task: plugin_api.Task) -> plugin_api.BotResponse:
        return plugin_api.BotResponse(ok=True, content="hi")


plugin_api.register_plugin_bot(HelloBot)


def test_plugin_routing():
    task = plugin_api.Task(intent="greet")
    resp = route("Hello-BOT", task)
    assert resp.ok and resp.content == "hi"
