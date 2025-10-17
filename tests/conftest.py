import importlib
import sys
from pathlib import Path

import pytest

MODULES = [
    "tools.storage",
    "security.signing",
    "orchestrator.audit",
    "security.rbac",
    "orchestrator.approvals",
    "orchestrator.tasks",
    "cli.console",
]


@pytest.fixture(autouse=True)
def _setup(tmp_path, monkeypatch):
    monkeypatch.setenv("PRISM_DATA_ROOT", str(tmp_path))
    for m in MODULES:
        if m in sys.modules:
            importlib.reload(sys.modules[m])
    yield
