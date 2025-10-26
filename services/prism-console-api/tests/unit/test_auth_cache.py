import asyncio

import pytest

from prism.config import Settings
from prism.services.auth import AuthVerifier


@pytest.mark.asyncio
async def test_auth_cache_hit(monkeypatch) -> None:
    settings = Settings()
    verifier = AuthVerifier(settings)
    token = "token"
    payload1 = await verifier.verify(token)
    payload2 = await verifier.verify(token)
    assert payload1 == payload2
    await verifier.close()
