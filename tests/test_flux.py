from close import flux


def test_flux_flags(tmp_path):
    rows = flux.run_flux("2025-09", "2025-08", "2024-09", 10.0)
    assert rows["1000"]["flag"]
