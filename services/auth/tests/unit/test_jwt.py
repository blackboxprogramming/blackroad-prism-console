import os

import pytest

from auth.config import Settings
from auth.crypto.jwt import JWTService


@pytest.fixture
def settings(tmp_path):
    return Settings(AUTH_JWT_HS_SECRET="secret", AUTH_JWT_ISS="https://issuer", AUTH_DB_URL=f"sqlite+aiosqlite:///{tmp_path}/test.db")


def test_jwt_encode_decode(settings):
    service = JWTService(settings)
    token = service.encode({"iss": settings.jwt_issuer, "sub": "123", "exp": 9999999999, "iat": 1, "jti": "abc"})
    decoded = service.decode(token)
    assert decoded["sub"] == "123"
