import math

import numpy as np
import pytest

from agents.asteria_codex import (
    Interval,
    clarke_subgrad,
    propagate_cov,
    pv_integral,
    safe_div,
    solve_least_squares,
    step_filippov,
)


def test_safe_division_policies() -> None:
    assert pytest.approx(0.0, abs=1e-6) == safe_div(1.0, 0.0, mode="clamp")

    zero_mode = safe_div(np.array([1.0, 2.0]), np.array([1.0, 0.0]), mode="zero", eps=1e-6)
    np.testing.assert_allclose(zero_mode, np.array([1.0, 0.0]))

    nan_mode = safe_div(5.0, 0.0, mode="nan")
    assert math.isnan(nan_mode)


def test_least_squares_matches_numpy() -> None:
    A = np.array([[1.0, 2.0], [2.0, 4.0], [3.0, 6.0]])
    b = np.array([1.0, 2.0, 3.0])

    expected = np.linalg.pinv(A) @ b
    np.testing.assert_allclose(solve_least_squares(A, b), expected)

    ridge_solution = solve_least_squares(A, b, ridge=1e-2)
    manual = np.linalg.solve(A.T @ A + 1e-2 * np.eye(2), A.T @ b)
    np.testing.assert_allclose(ridge_solution, manual)


def test_clarke_subgradient_shape_and_mean() -> None:
    def f(x: np.ndarray) -> float:
        return float(np.linalg.norm(x, ord=2))

    info = clarke_subgrad(f, np.zeros(3), radius=1e-4, samples=32, seed=1)
    assert info["samples"].shape == (32, 3)
    np.testing.assert_allclose(info["mean"], np.zeros(3), atol=5e-2)


def test_filippov_step_average() -> None:
    def velocity_field(x: np.ndarray) -> list[np.ndarray]:
        _ = x
        return [np.array([1.0, 0.0]), np.array([0.0, 1.0])]

    next_state = step_filippov(np.array([0.0, 0.0]), velocity_field, dt=0.1)
    np.testing.assert_allclose(next_state, np.array([0.05, 0.05]))


def test_principal_value_integral_symmetry() -> None:
    result = pv_integral(lambda xs: np.ones_like(xs), -1.0, 1.0, 0.0, eps=1e-4, n=2048)
    assert abs(result) < 1e-4


def test_interval_arithmetic_operations() -> None:
    interval = Interval(-1.0, 2.0)
    other = Interval(3.0, 4.0)

    assert interval + 1 == Interval(0.0, 3.0)
    assert interval - 1 == Interval(-2.0, 1.0)
    assert interval * other == Interval(-4.0, 8.0)

    quotient = other / Interval(1.0, 2.0)
    assert quotient.lo <= 1.5 <= quotient.hi

    with pytest.raises(ZeroDivisionError):
        _ = interval / Interval(-0.5, 0.5)


def test_covariance_propagation_linear_map() -> None:
    def g(x: np.ndarray) -> np.ndarray:
        return np.array([x[0] + 2.0 * x[1]])

    x = np.array([1.0, 2.0])
    Sigma = np.diag([0.25, 0.04])

    Sigma_y, J = propagate_cov(g, x, Sigma, eps=1e-5)
    expected_J = np.array([[1.0, 2.0]])
    expected_cov = expected_J @ Sigma @ expected_J.T

    np.testing.assert_allclose(J, expected_J, atol=1e-4)
    np.testing.assert_allclose(Sigma_y, expected_cov, atol=1e-4)
