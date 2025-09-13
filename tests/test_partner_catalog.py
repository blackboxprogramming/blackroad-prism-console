import json
from pathlib import Path

from partners import catalog

CONFIG_DIR = Path("configs/partners")


def test_load_and_list_show(tmp_path):
    # use existing sample config
    data = catalog.load_catalog(CONFIG_DIR)
    assert data["partners"][0]["id"] == "P001"

    partners = catalog.list_partners(tier="Gold")
    assert partners and partners[0]["name"] == "Sample Partner"

    info = catalog.show_partner("P001")
    assert info["listings"][0]["sku"] == "F500-PRO"
