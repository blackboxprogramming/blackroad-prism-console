import json
from pathlib import Path

from fastapi.testclient import TestClient

from roadglitch.main import app


HEADERS = {"Authorization": "Bearer dev-token"}


SIMPLE_WORKFLOW = {
    "name": "notify_slow_api",
    "version": "1.0.0",
    "trigger": {"type": "manual"},
    "graph": {
        "nodes": {
            "start": {"uses": "connector.template.echo", "with": {"message": "${input['msg']}"}}
        },
        "edges": [],
    },
}


def test_create_and_run_workflow(tmp_path, monkeypatch):
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    db_file = data_dir / "roadglitch.db"
    if db_file.exists():
        db_file.unlink()
    with TestClient(app) as client:
        response = client.post("/workflows", headers=HEADERS, json=SIMPLE_WORKFLOW)
        assert response.status_code == 200
        workflow_id = response.json()["id"]

        run_response = client.post(
            "/runs",
            headers={**HEADERS, "Idempotency-Key": "abc"},
            json={"workflowId": workflow_id, "input": {"msg": "hello"}},
        )
        assert run_response.status_code == 200
        run_id = run_response.json()["runId"]

        run_response_dupe = client.post(
            "/runs",
            headers={**HEADERS, "Idempotency-Key": "abc"},
            json={"workflowId": workflow_id, "input": {"msg": "hello"}},
        )
        assert run_response_dupe.json()["runId"] == run_id

        final_data = client.get(f"/runs/{run_id}", headers=HEADERS).json()
        assert final_data["run"]["status"] in {"queued", "running", "succeeded"}

    with TestClient(app) as client:
        final_data = client.get(f"/runs/{run_id}", headers=HEADERS).json()
        assert final_data["run"]["status"] == "succeeded"
        assert final_data["run"]["result"]["start"]["echo"] == "hello"

        metrics_resp = client.get("/metrics")
        assert metrics_resp.status_code == 200
        assert "roadglitch_runs_total" in metrics_resp.text
        assert "roadglitch_node_events_total" in metrics_resp.text

