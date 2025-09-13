# Blackroad Prism Console

A minimal multi-bot orchestration console demonstrating task routing and guardrails.

## Quickstart

```bash
python -m cli.console bot:list
python -m cli.console task:create "Review cash" finance
# copy the returned task id
python -m cli.console task:route <TASK_ID>
```

## Architecture

```
+-----------+        +--------------+        +------------+
|   CLI     | -----> | Orchestrator | -----> |   Bots     |
+-----------+        +--------------+        +------------+
                               |
                        memory.jsonl
```

## Security Model

- No network or database calls.
- All actions appended to `memory.jsonl`.
- Tasks checked for privacy/security metadata.
- Bots contain guardrail docstrings and red-team awareness.

## Bot Template

```python
class ExampleBot:
    """ExampleBot

    MISSION: Example mission.
    INPUTS: Expected inputs.
    OUTPUTS: Expected outputs.
    KPIS: Key performance indicators.
    GUARDRAILS: Safety constraints.
    HANDOFFS: Downstream bots.
    """

    def run(self, task: Task) -> Response:
        ...
```

## Example Run

```bash
$ python -m cli.console task:create "Review treasury position" finance
123e4567-e89b-12d3-a456-426614174000
$ python -m cli.console task:route 123e4567-e89b-12d3-a456-426614174000
success
```
