from datetime import datetime

from bots import available_bots
from bots.integration_bots import integration_bot_names
from orchestrator.protocols import Task


def test_registry_contains_all_integration_bots() -> None:
    registry = available_bots()
    expected_names = set(integration_bot_names())
    assert expected_names.issubset(set(registry)), "Missing integration bots from registry"


def test_integration_bot_runs_with_mention() -> None:
    registry = available_bots()
    # Use a known platform from the integration plan
    slack_bot_cls = registry["Slack-BOT"]
    bot = slack_bot_cls()

    task = Task(
        id="task-123",
        goal="Coordinate Slack rollout for @blackboxprogramming",
        context={"mentions": ["@blackboxprogramming"]},
        created_at=datetime.utcnow(),
    )

    response = bot.run(task)

    assert response.ok is True
    assert "Slack" in response.summary
    assert response.data["linear_payload"]["status"] == "pending-review"
    assert response.artifacts[0].endswith("slack-handoff.json")


def test_integration_bot_awaits_mention() -> None:
    registry = available_bots()
    airtable_bot_cls = registry["Airtable-BOT"]
    bot = airtable_bot_cls()

    task = Task(
        id="task-456",
        goal="Prepare Airtable sync without explicit mention",
        context={},
        created_at=datetime.utcnow(),
    )

    response = bot.run(task)

    assert response.ok is False
    assert "Queued" in response.summary
    assert any("Watch for @blackboxprogramming" in action for action in response.next_actions)

