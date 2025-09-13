from pathlib import Path

from sec.sbom_watch import ALERT_JSON, watch
from sec import utils


def test_sbom_watch_alerts():
    alerts = watch(Path("dist/SBOM.spdx.json"), Path("fixtures/sec/cves_local.json"))
    assert alerts and alerts[0]["package"] == "package1"
    data = utils.read_json(ALERT_JSON)
    assert data[0]["cves"]
