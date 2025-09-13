from close import flux


def test_flux_no_flags():
    results = flux.run_flux('2025-09', '2025-08', '2024-09', 10.0)
    assert all(not r['flag'] for r in results)
