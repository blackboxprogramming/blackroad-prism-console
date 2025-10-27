from __future__ import annotations

import math

import numpy as np
import pytest

from lucidia_math_lab import (
    ArithmeticSymmetryEngine,
    ComplexMatrixMapper,
    EntropyFieldMapper,
    FractalMobiusCoupler,
    GaussianSignalAnalyzer,
    HilbertPhaseAnalyzer,
    NoetherAnalyzer,
    QuantumFieldManifold,
    QuaternionicRotationEngine,
)


def test_gaussian_signal_fourier_consistency() -> None:
    analyzer = GaussianSignalAnalyzer(mean=0.0, sigma=1.0)
    value = analyzer.time_domain([0.0])[0]
    assert math.isclose(value, 1.0 / math.sqrt(2.0 * math.pi))

    omega = np.array([0.3])
    derivative = analyzer.derivative_frequency_domain(omega)[0]
    expected = 1j * omega[0] * analyzer.frequency_domain(omega)[0]
    assert np.allclose(derivative, expected)

    coherence = analyzer.coherence()
    assert math.isclose(coherence["uncertainty_product"], 1.0)


def test_arithmetic_symmetry_engine_components() -> None:
    engine = ArithmeticSymmetryEngine()
    assert engine.faulhaber_sum(2, 3) == pytest.approx(14.0)

    ramanujan = engine.ramanujan_sum(4, 1)
    assert abs(ramanujan) < 1e-9

    product = engine.euler_product(2.0, terms=6)
    expected = math.pi**2 / 6.0
    assert abs(product.real - expected) / expected < 0.05

    signature = engine.symmetry_signature(3, 2, 2, 2.0 + 0j, fractal_seed=0.2 + 0.2j)
    assert "fractal_limit" in signature
    assert signature["fractal_limit"] >= 1


def test_complex_matrix_mapper_roundtrip() -> None:
    value = 2.0 - 3.0j
    matrix = ComplexMatrixMapper.to_matrix(value)
    reconstructed = ComplexMatrixMapper.from_matrix(matrix)
    assert reconstructed == pytest.approx(value)


def test_quaternionic_rotation_engine_rotates_vectors() -> None:
    engine = QuaternionicRotationEngine.from_axis_angle([0.0, 0.0, 1.0], math.pi / 2.0)
    rotated = engine.rotate([1.0, 0.0, 0.0])
    assert np.allclose(rotated, [0.0, 1.0, 0.0], atol=1e-7)


def test_quantum_field_manifold_links_equations() -> None:
    hamiltonian = np.diag([1.0, 2.0])
    manifold = QuantumFieldManifold(hamiltonian, mass=1.0, hbar=1.0)

    psi = np.array([1.0 + 0.0j, 0.0 + 0.0j])
    rhs = manifold.schrodinger_rhs(psi)
    assert np.allclose(rhs, np.array([-1j, 0.0j]))

    density = manifold.probability_density(psi)
    assert np.allclose(density, np.array([1.0, 0.0]))

    rest_spinor = np.array([1.0, 0.0, 0.0, 0.0], dtype=complex)
    residual = manifold.dirac_residual(rest_spinor, momentum=[0.0, 0.0, 0.0])
    assert np.allclose(residual, np.zeros(4, dtype=complex))


def test_fractal_mobius_coupler_identity() -> None:
    coupler = FractalMobiusCoupler(1, 0, 0, 1)
    trajectory = coupler.iterate(0.5 + 0.5j, max_iter=5)
    assert len(trajectory) == 6
    assert coupler.bounded(0.5 + 0.5j, max_iter=10)


def test_noether_analyzer_translation_invariance() -> None:
    mass = 2.5

    def lagrangian(_t: float, _q: np.ndarray, qdot: np.ndarray) -> float:
        return 0.5 * mass * float(np.dot(qdot, qdot))

    analyzer = NoetherAnalyzer(lagrangian)
    momentum = analyzer.conjugate_momentum(0.0, np.array([0.0]), np.array([1.2]))
    assert np.allclose(momentum, np.array([mass * 1.2]))

    conserved = analyzer.conserved_quantity(0.0, np.array([0.0]), np.array([1.2]), np.array([1.0]))
    assert math.isclose(conserved, mass * 1.2)


def test_entropy_field_mapper_matches_gaussian_formula() -> None:
    mapper = EntropyFieldMapper(k_B=1.0)
    sigma = 1.0
    entropy = mapper.gaussian_entropy(sigma)
    expected = math.log(sigma * math.sqrt(2.0 * math.pi * math.e))
    assert math.isclose(entropy, expected)


def test_hilbert_phase_analyzer_extracts_frequency() -> None:
    samples = 512
    dt = 1.0 / samples
    t = np.arange(samples) * dt
    freq_hz = 5.0
    signal = np.sin(2.0 * math.pi * freq_hz * t)

    analyzer = HilbertPhaseAnalyzer(dt=dt)
    amplitude = analyzer.instantaneous_amplitude(signal)
    assert np.allclose(amplitude[10:-10], 1.0, atol=1e-2)

    frequency = analyzer.instantaneous_frequency(signal)
    assert np.allclose(frequency[10:-10], freq_hz, atol=5e-2)

    derivative = analyzer.differentiate_via_fourier(signal)
    expected = 2.0 * math.pi * freq_hz * np.cos(2.0 * math.pi * freq_hz * t)
    assert np.allclose(derivative[10:-10], expected[10:-10], atol=1e-2)
