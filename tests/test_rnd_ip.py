import json
import shutil
import pytest
from rnd import ip


def _clean():
    shutil.rmtree(ip.ARTIFACTS, ignore_errors=True)
    shutil.rmtree(ip.LAKE, ignore_errors=True)
    ip.ARTIFACTS.mkdir(parents=True, exist_ok=True)
    ip.LAKE.mkdir(parents=True, exist_ok=True)


def test_ip_log_and_update():
    _clean()
    disc = ip.new("I001", "Fast", ["U1"], ["US"])
    path = ip.ARTIFACTS / "ip" / f"{disc.id}.json"
    data = json.loads(path.read_text())
    old_hash = data["hash"]
    ip.update(disc.id, "submitted")
    data2 = json.loads(path.read_text())
    assert data2["status"] == "submitted"
    assert data2["hash"] != old_hash
    with pytest.raises(RuntimeError):
        ip.update(disc.id, "filed")
