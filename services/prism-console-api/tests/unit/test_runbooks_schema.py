from prism.schemas.runbooks import Runbook, RunbookExecuteRequest


def test_runbook_schema_roundtrip() -> None:
    schema = Runbook(
        id="rb-1",
        title="Warm cache",
        description="Warms cache",
        tags=["cache"],
        inputsSchema={"type": "object"},
        linkedWorkflow="workflow/1",
    )

    assert schema.inputsSchema["type"] == "object"


def test_runbook_execute_request_defaults() -> None:
    request = RunbookExecuteRequest()
    assert request.input is None
    assert request.idempotencyKey is None
