from legal import export_controls


def test_screen():
    v = export_controls.screen("BadCorp", "samples/sales/order_lines.json")
    assert "EXP_ENTITY_MATCH" in v
    assert "EXP_REGION_BLOCK" in v
    assert "EXP_LICENSE_REQUIRED" in v
