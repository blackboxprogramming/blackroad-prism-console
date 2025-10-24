"""Smoke test for deploy resource."""
from typing import Any, Dict

import pytest

from blackroad.deploys import DeploysResource


class DummyClient:
    def __init__(self) -> None:
        self.calls: list[tuple[str, Dict[str, Any]]] = []

    async def request(self, path: str, options: Dict[str, Any]) -> Dict[str, Any]:
        self.calls.append((path, options))
        return {"releaseId": "rel_1", "status": "pending"}


@pytest.mark.asyncio
async def test_create_deploy_generates_idempotency_key() -> None:
    dummy = DummyClient()
    resource = DeploysResource(dummy.request)
    response = await resource.create({"serviceId": "svc", "environment": "staging", "gitRef": "abc1234"})

    assert response["releaseId"] == "rel_1"
    assert dummy.calls[0][0] == "/v1/deploys"
    headers = dummy.calls[0][1]["headers"]
    assert "Idempotency-Key" in headers
