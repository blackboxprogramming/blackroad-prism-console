from lucidia_math_lab.prime_explorer import (
    fourier_prime_gaps,
    residue_grid,
    ulam_spiral,
)


def test_residue_grid():
    grid = residue_grid(5, size=25)
    assert grid.shape == (5, 5)


def test_ulam_spiral():
    grid, mask = ulam_spiral(5)
    assert grid.shape == (5, 5)
    assert mask.shape == (5, 5)


def test_fourier_prime_gaps():
    gaps, fft = fourier_prime_gaps(50)
    assert len(gaps) == len(fft)
