from typing import Any, Dict

import base64
import pytest

from tools.atlassian import create_jira_issue


class DummyResponse:
    def __init__(self, data: Dict[str, Any]):
        self._data = data

    def json(self) -> Dict[str, Any]:
        return self._data

    def raise_for_status(self) -> None:  # pragma: no cover - simple stub
        return None


def test_create_jira_issue(monkeypatch: pytest.MonkeyPatch) -> None:
    called: Dict[str, Any] = {}

    def fake_post(url: str, *, headers: Dict[str, str], json: Dict[str, Any], timeout: int) -> DummyResponse:
        called["url"] = url
        called["headers"] = headers
        called["json"] = json
        return DummyResponse({"id": "100"})

    monkeypatch.setenv("ATLASSIAN_BASE_URL", "https://example.atlassian.net")
    monkeypatch.setenv("ATLASSIAN_EMAIL", "user@example.com")
    monkeypatch.setenv("ATLASSIAN_API_TOKEN", "token123")
    monkeypatch.setattr("requests.post", fake_post)

    result = create_jira_issue("test", "desc", "BR")
    assert result == {"id": "100"}
    assert called["url"] == "https://example.atlassian.net/rest/api/3/issue"
    assert called["json"]["fields"]["project"]["key"] == "BR"
    auth = called["headers"]["Authorization"]
    assert auth.startswith("Basic ")
    decoded = base64.b64decode(auth[6:]).decode()
    assert decoded == "user@example.com:token123"
