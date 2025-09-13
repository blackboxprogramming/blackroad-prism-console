from pathlib import Path

from licensing import entitlements, keys


def test_add_and_resolve(tmp_path):
    # ensure clean entitlements store
    art = entitlements.ARTIFACTS  # type: ignore
    if Path(art).exists():
        Path(art).unlink()
    key = keys.generate_key("ACME", "F500-PRO", 5, "2025-01-01", "2025-12-31")
    entitlements.add_from_key(key)
    res = entitlements.resolve("ACME", on="2025-06-01")
    assert res["seats"] == 5
    assert "pro" in res["features"]
