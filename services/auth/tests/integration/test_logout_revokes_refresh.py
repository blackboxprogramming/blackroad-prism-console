import pytest
import pytest_asyncio
from httpx import AsyncClient

from auth.config import Settings
from auth.main import create_app
from auth import dependencies


@pytest_asyncio.fixture
async def client(tmp_path):
    database_url = f"sqlite+aiosqlite:///{tmp_path}/logout.db"
    settings = Settings(AUTH_DB_URL=database_url, AUTH_JWT_HS_SECRET="secret", AUTH_JWT_ISS="https://issuer")
    dependencies.configure_dependencies(settings)
    await dependencies.init_db()
    app = create_app(settings)
    await app.router.startup()
    async with AsyncClient(app=app, base_url="http://testserver") as async_client:
        yield async_client
    await app.router.shutdown()


@pytest.mark.asyncio
async def test_logout_revokes_refresh(client: AsyncClient):
    await client.post("/signup", json={"email": "user@example.com", "password": "password"})
    login = await client.post("/login", json={"email": "user@example.com", "password": "password"})
    refresh = login.json()["refreshToken"]
    await client.post("/logout", json={"refreshToken": refresh})
    response = await client.post("/tokens/refresh", json={"refreshToken": refresh})
    assert response.status_code == 401
