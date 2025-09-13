import json

from enablement import paths
from enablement.utils import ART
from tools import storage


def test_path_and_assign(tmp_path):
    p = paths.new_path("SE Onboarding", "Solutions Engineer", ["C101", "C201"], 85)
    assert p.id == "SE_ONB"
    a = paths.assign("U_SE01", p.id, "2025-10-30")
    assert a.path_id == p.id
    data = json.loads(storage.read(str(ART / "assignments.json")))
    assert any(item["user_id"] == "U_SE01" for item in data)
