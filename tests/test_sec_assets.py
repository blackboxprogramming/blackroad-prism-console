from pathlib import Path

from sec.assets import ASSET_FILE, list_assets, load_from_dir


def test_assets_load_and_list():
    assets = load_from_dir(Path("fixtures/sec"))
    assert ASSET_FILE.exists()
    assert len(assets) == 3
    services = list_assets("service")
    assert services and services[0].id == "SVC1"
    assert (ASSET_FILE.with_suffix(".json.sha256")).exists()
