# Plugin SDK

```python
from sdk import plugin_api

class HelloBot(plugin_api.BaseBot):
    NAME = "Hello-BOT"

    def handle(self, task: plugin_api.Task) -> plugin_api.BotResponse:
        return plugin_api.BotResponse(ok=True, content="hello " + task.inputs.get("name", "world"))

plugin_api.register_plugin_bot(HelloBot)
```
