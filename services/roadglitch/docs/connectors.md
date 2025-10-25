# RoadGlitch Connectors

Connectors implement the `Connector` protocol and register through `roadglitch.connectors.registry`. To add a new connector, create a module under `src/roadglitch/connectors/`, expose a class with a `name` attribute, and ensure it provides an async `execute(context, params)` method returning a dictionary.

## Built-in Connectors

| Name | Description |
| --- | --- |
| `builtin.eval` | Evaluates sandboxed expressions for control flow. |
| `connector.http.get` | Performs HTTP GET requests. |
| `connector.http.post` | Performs HTTP POST requests. |
| `connector.slack.postMessage` | Mock connector that logs Slack messages. |
| `connector.shell.exec` | Executes shell commands when explicitly enabled. |
| `connector.template.echo` | Example template connector illustrating the interface. |

## Template Connector

See `src/roadglitch/connectors/template.py` for a starting point:

```python
class TemplateConnector:
    name = "connector.template.echo"

    async def execute(self, *, context, params):
        return {"echo": params.get("message", ""), "context": context.get("run_id")}
```

After defining the connector, add it to `build_registry()` in `registry.py` so it is auto-discovered. Unit tests in `tests/unit/test_connector_template.py` exercise the template connector dynamically.

