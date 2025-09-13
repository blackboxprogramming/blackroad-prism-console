from pathlib import Path
import yaml

from sales import catalog
from pricing import elasticity


def setup_module(_):
    catalog.load(Path('configs/sales'))


def test_simulation_deterministic(tmp_path):
    scenarios = yaml.safe_load(Path('samples/sales/price_scenarios.yaml').read_text())["scenarios"]
    report = elasticity.simulate(scenarios, 6)
    r = report["results"][0]
    assert r["demand_delta"] == 15.0
    assert r["revenue_delta"] == 350.0
    assert r["margin_delta"] == 105.0
    assert Path(report["summary_path"]).exists()
    assert Path(report["series_path"]).exists()
