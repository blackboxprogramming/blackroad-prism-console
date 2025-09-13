from pathlib import Path

from orchestrator import audit
from security import rbac
from tools import storage


def test_sign_and_verify():
    user = rbac.rbac.get_user("U_SYS")
    audit.log_event("test", ok=True, user=user)
    assert audit.verify_log() == []
    path = storage.DATA_ROOT / "orchestrator/memory.jsonl"
    content = path.read_text()
    path.write_text(content.replace("test", "tampered"))
    bad = audit.verify_log()
    assert bad
