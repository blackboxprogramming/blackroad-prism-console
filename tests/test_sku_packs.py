from licensing import sku_packs


def test_load_and_merge():
    skus = sku_packs.load_skus()
    assert "F500-CORE" in skus and "F500-PRO" in skus
    assert sku_packs.validate_dependencies(skus)
    limits = sku_packs.merged_limits("F500-ENTERPRISE", skus)
    assert limits["tasks_per_day"] == 1000
    assert limits["data_bytes_per_day"] == 10000
