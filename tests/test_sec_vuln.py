from pathlib import Path

from sec.vuln import BACKLOG_JSON, import_csv, prioritize
from sec import utils


def test_vuln_prioritize():
    import_csv(Path("fixtures/sec/vulns.csv"))
    top = prioritize(2)
    assert len(top) == 2
    data = utils.read_json(BACKLOG_JSON)
    assert data[0]["priority"] >= data[1]["priority"]
