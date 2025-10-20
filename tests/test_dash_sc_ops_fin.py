from pathlib import Path

from dashboards.sc_ops_fin import build


def test_dashboard_build(tmp_path):
    data = {"service_level": 0.9}
    build(data)
    md = Path("artifacts/dashboards/sc_ops_fin.md")
    assert md.exists()
