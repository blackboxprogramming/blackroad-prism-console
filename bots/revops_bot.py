from sdk import plugin_api

CAPABILITIES = [
    {"intent": "forecast_check", "inputs_schema": {"type": "object"}, "outputs_schema": {"type": "object"}}
]


class RevOpsBot(plugin_api.BaseBot):
    NAME = "RevOps-BOT"

    def handle(self, task: plugin_api.Task) -> plugin_api.BotResponse:
        return plugin_api.BotResponse(ok=True, content="forecast ok")


plugin_api.register_plugin_bot(RevOpsBot)
