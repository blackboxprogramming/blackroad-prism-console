from fastapi.testclient import TestClient

from roadglitch.main import app


def test_openapi_contract():
    with TestClient(app) as client:
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "paths" in data
        for path in ["/workflows", "/runs", "/health"]:
            assert path in data["paths"]

