from pathlib import Path

from partners import catalog, certify

CONFIG_DIR = Path("configs/partners")
ANS = Path("fixtures/partners/exams/answers_P001.json")


def test_certification_flow(tmp_path):
    cert_path = certify.ART  # type: ignore
    if cert_path.exists():
        cert_path.unlink()
    catalog.load_catalog(CONFIG_DIR)
    attempt = certify.grade("P001", "integration_basics", ANS)
    assert attempt.status == "passed"
    status = certify.status("P001")
    assert status and status[0]["status"] == "passed"
