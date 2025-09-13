from pathlib import Path

from sec.detect.engine import run
from sec import utils


def test_detection_engine_generates_detections():
    results = run(Path("configs/sec/rules"), Path("fixtures/sec/logs"))
    assert "suspicious_login" in results
    det_dir = utils.ARTIFACT_DIR / "detections"
    files = list(det_dir.glob("suspicious_login_*.json"))
    assert files
    data = utils.read_json(files[0])
    assert data[0]["rule"] == "suspicious_login"
