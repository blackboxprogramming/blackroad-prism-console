from fastapi.testclient import TestClient

from roadglitch.main import app, rate_limiter


def test_rate_limit_exceeded(monkeypatch):
    with TestClient(app) as client:
        headers = {"Authorization": "Bearer dev-token"}
        for _ in range(61):
            response = client.get("/health", headers=headers)
            if response.status_code == 429:
                break
        else:
            assert False, "Rate limit not enforced"
    import asyncio

    asyncio.run(rate_limiter.reset())

