import pytest
import pytest_asyncio
from sqlmodel.ext.asyncio.session import AsyncSession, create_async_engine, sessionmaker

from auth.config import Settings
from auth.crypto.jwt import JWTService
from auth.crypto.tokens import TokenService
from auth.models import User
from sqlmodel import SQLModel
from auth.repo import RefreshTokenRepository, RevokedJTIRepository, UserRepository


@pytest_asyncio.fixture
async def session(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path}/test.db", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as sess:
        yield sess


@pytest.fixture
def token_service(session):
    settings = Settings(AUTH_JWT_HS_SECRET="secret", AUTH_DB_URL="sqlite+aiosqlite://", AUTH_JWT_ISS="https://issuer")
    jwt_service = JWTService(settings)
    refresh_repo = RefreshTokenRepository(session)
    revoked_repo = RevokedJTIRepository(session)
    user_repo = UserRepository(session)
    return TokenService(settings, jwt_service, refresh_repo, revoked_repo, user_repo)


@pytest.mark.asyncio
async def test_issue_and_rotate_tokens(session, token_service):
    users = UserRepository(session)
    user = await users.create_user("user@example.com", "hash")
    tokens = await token_service.issue_tokens(user_id=user.id, scope=user.scope, fingerprint="abc")
    assert "accessToken" in tokens
    rotated = await token_service.rotate_refresh(refresh_token=tokens["refreshToken"], fingerprint="abc")
    assert rotated["refreshToken"] != tokens["refreshToken"]


@pytest.mark.asyncio
async def test_rotate_invalid_token(token_service):
    with pytest.raises(ValueError):
        await token_service.rotate_refresh(refresh_token="invalid", fingerprint=None)
