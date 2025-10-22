from typing import Any

import pytest

from tools.codex_pipeline import call_connectors


class DummyResponse:
    def __init__(self, data: dict[str, Any]):
        self._data = data

    def json(self) -> dict[str, Any]:
        return self._data

    def raise_for_status(self) -> None:  # pragma: no cover - simple stub
        return None


@pytest.mark.parametrize("action", ["paste", "append", "replace", "restart", "build"])
def test_call_connectors(monkeypatch: pytest.MonkeyPatch, action: str) -> None:
    called: dict[str, Any] = {}

    def fake_post(
        url: str, *, headers: dict[str, str], json: dict[str, Any], timeout: int
    ) -> DummyResponse:
        called["url"] = url
        called["headers"] = headers
        called["json"] = json
        return DummyResponse({"ok": True})

    monkeypatch.setenv("CONNECTOR_KEY", "test-key")
    monkeypatch.setattr("requests.post", fake_post)

    payload = {"demo": 1}
    assert call_connectors(action, payload) == {"ok": True}

    assert called["url"] == f"https://blackroad.io/connectors/{action}"
    assert called["headers"] == {"Authorization": "Bearer test-key"}
    assert called["json"] == payload
