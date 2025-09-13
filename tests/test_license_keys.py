from licensing import keys


def test_generate_and_verify():
    key = keys.generate_key("ACME", "F500-PRO", 10, "2025-01-01", "2025-12-31")
    payload = keys.verify_key(key)
    assert payload["tenant"] == "ACME"
    assert payload["sku"] == "F500-PRO"
