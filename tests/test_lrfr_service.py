import json
import os
from pathlib import Path

from fastapi.testclient import TestClient

# Dynamically load the lrfr_service module
import importlib.util


spec = importlib.util.spec_from_file_location(
    "lrfr_service", str(Path("var/www/blackroad/api/lrfr_service.py"))
)
lrfr_service = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(lrfr_service)


def test_submit_creates_request(tmp_path, monkeypatch):
    os.environ["LRFR_DIR"] = str(tmp_path)
    os.environ["PSI_SEED"] = "test-seed"
    lrfr_service.LRFR_DIR = str(tmp_path)
    lrfr_service.SCHEMA_PATH = str(tmp_path / "schema.json")
    lrfr_service.INDEX_PATH = str(tmp_path / "index.json")
    # Avoid running external rebuild script during tests
    monkeypatch.setattr(lrfr_service, "rebuild_index", lambda: None)

    client = TestClient(lrfr_service.app)

    payload = {
        "id": "2025-01-01-test",
        "title": "Test Request",
        "summary": "summary",
        "problem": "problem",
        "constraints": "",
        "acceptance_criteria": ["done"],
        "tags": [],
        "agent": "guardian",
        "difficulty": "starter",
        "status": "open",
        "bounty": {"roadcoin": 0, "usd": 0},
        "owner": {"name": "n", "contact": "c"},
        "machine_decomposition": {
            "tasks": [],
            "skills": [],
            "datasets": [],
            "interfaces": [],
        },
        "thread": [],
        "created_at": "2025-01-01T00:00:00",
        "updated_at": "2025-01-01T00:00:00",
        "signing": {"algorithm": "PS-SHA∞", "signature": ""},
    }

    res = client.post("/api/lrfr/submit", json=payload)
    assert res.status_code == 200

    saved = tmp_path / "2025-01-01-test.json"
    assert saved.exists()
    data = json.loads(saved.read_text())
    assert data["title"] == "Test Request"
