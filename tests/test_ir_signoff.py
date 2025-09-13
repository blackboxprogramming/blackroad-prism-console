import json
from ir import kpi_signoff


def test_signoff_flow(tmp_path):
    if kpi_signoff.SIGNOFF_PATH.exists():
        kpi_signoff.SIGNOFF_PATH.unlink()
    kpi_signoff.request_signoff("revenue", "2025Q3", "tester")
    kpi_signoff.approve("revenue", "2025Q3", "U_CFO")
    lines = kpi_signoff.SIGNOFF_PATH.read_text().strip().splitlines()
    statuses = [json.loads(l)["status"] for l in lines]
    assert "approved" in statuses
