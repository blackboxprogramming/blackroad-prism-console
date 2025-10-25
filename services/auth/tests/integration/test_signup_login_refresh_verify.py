import pytest
import pytest_asyncio
from httpx import AsyncClient

from auth.config import Settings
from auth.main import create_app
from auth import dependencies


@pytest_asyncio.fixture
async def test_app(tmp_path):
    database_url = f"sqlite+aiosqlite:///{tmp_path}/integration.db"
    settings = Settings(
        AUTH_DB_URL=database_url,
        AUTH_JWT_HS_SECRET="secret",
        AUTH_JWT_ISS="https://auth.test",
    )
    dependencies.configure_dependencies(settings)
    await dependencies.init_db()
    app = create_app(settings)
    await app.router.startup()
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client
    await app.router.shutdown()


@pytest.mark.asyncio
async def test_full_flow(test_app: AsyncClient):
    signup = await test_app.post("/signup", json={"email": "user@example.com", "password": "password123"})
    assert signup.status_code == 201

    login = await test_app.post("/login", json={"email": "user@example.com", "password": "password123", "fingerprint": "fp"})
    assert login.status_code == 200
    tokens = login.json()

    verify = await test_app.post("/tokens/verify", headers={"Authorization": f"Bearer {tokens['accessToken']}"})
    assert verify.json()["valid"] is True

    refreshed = await test_app.post("/tokens/refresh", json={"refreshToken": tokens["refreshToken"], "fingerprint": "fp"})
    assert refreshed.status_code == 200

    logout = await test_app.post("/logout", json={"refreshToken": refreshed.json()["refreshToken"]})
    assert logout.status_code == 200
