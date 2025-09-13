from pathlib import Path

import pytest

from orchestrator import settings, tenancy
from tools import storage


def test_isolated_paths(monkeypatch):
    monkeypatch.setattr(settings, "MULTI_TENANT", True)
    monkeypatch.setenv("PRISM_TENANT", "TEN1")
    storage.write("artifacts/test.txt", "one")
    assert Path("app/data/tenants/TEN1/artifacts/test.txt").exists()
    monkeypatch.setenv("PRISM_TENANT", "TEN2")
    storage.write("artifacts/test.txt", "two")
    assert Path("app/data/tenants/TEN2/artifacts/test.txt").exists()


def test_rbac(monkeypatch):
    with pytest.raises(PermissionError):
        tenancy.assert_tenant_access([], "TEN1", "TEN2")
    tenancy.assert_tenant_access(["TENANT_ADMIN"], "TEN1", "TEN2")
