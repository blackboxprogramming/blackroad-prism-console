import importlib
import pathlib
import sys

import pytest

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1] / "servers" / "lucidia_fs"))
from lucidia_fs import server as fs_server


def test_resolve_path(tmp_path, monkeypatch):
    monkeypatch.setenv("LUCIDIA_FS_ROOT", str(tmp_path))
    importlib.reload(fs_server)
    assert fs_server._resolve_path("allowed.txt") == tmp_path / "allowed.txt"
    with pytest.raises(ValueError):
        fs_server._resolve_path("../secret.txt")
