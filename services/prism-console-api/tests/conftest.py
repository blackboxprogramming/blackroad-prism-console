from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from prism.config import Settings
from prism.main import create_app


@pytest.fixture
def test_settings() -> Settings:
    return Settings(mock_mode=True, db_url="sqlite:///:memory:")


@pytest.fixture
def client(test_settings: Settings) -> TestClient:
    app = create_app(test_settings)
    with TestClient(app) as client:
        yield client
