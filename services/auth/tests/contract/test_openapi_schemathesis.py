from fastapi.testclient import TestClient

from auth.main import create_app


def test_openapi_document_available():
    app = create_app()
    client = TestClient(app)
    response = client.get("/openapi.json")
    assert response.status_code == 200
    body = response.json()
    assert "/login" in body["paths"]
    assert "Auth Service" == body["info"]["title"]
