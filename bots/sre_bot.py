from sdk import plugin_api

CAPABILITIES = [
    {"intent": "error_budget", "inputs_schema": {"type": "object"}, "outputs_schema": {"type": "object"}}
]


class SREBot(plugin_api.BaseBot):
    NAME = "SRE-BOT"

    def handle(self, task: plugin_api.Task) -> plugin_api.BotResponse:
        return plugin_api.BotResponse(ok=True, content="error budget ok")


plugin_api.register_plugin_bot(SREBot)
