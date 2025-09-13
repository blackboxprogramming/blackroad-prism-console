import json

from enablement import courses, paths, readiness
from enablement.utils import ART, ROOT
from tools import storage


def test_readiness_computation():
    courses.load_courses(str(ROOT / "configs/enablement/courses"))
    p = paths.new_path("SE Onboarding", "Solutions Engineer", ["C101", "C201"], 85)
    paths.assign("U1", p.id, "2099-01-01")
    data = json.loads(storage.read(str(ART / "assignments.json")))
    data[-1]["progress"] = {"M1": True}
    storage.write(str(ART / "assignments.json"), json.dumps(data))
    res = readiness.build()
    assert res["U1"]["percent_complete"] == 25
