import json
from pathlib import Path

from sec import utils
from sec.detect.engine import run
from sec.ir import INCIDENT_FILE, add_timeline, assign, open_from_detections, resolve


def test_ir_flow():
    run(Path("configs/sec/rules"), Path("fixtures/sec/logs"))
    det_files = list((utils.ARTIFACT_DIR / "detections").glob("*.json"))
    inc = open_from_detections(det_files)
    assert inc.status == "open"
    assign(inc.id, "U_SEC")
    add_timeline(inc.id, "Contained host H-22")
    resolve(inc.id, "Credentials reset")
    lines = [l for l in INCIDENT_FILE.read_text().splitlines() if l.strip()]
    data = json.loads(lines[-1])
    assert data["status"] == "resolved"
