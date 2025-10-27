"""Unified Geometry Engine (Package 6).

This module encodes the analytical layers described in Cecilia's
whiteboard notes.  Each class models a mathematical subsystem that can be
used independently or composed through :class:`UnifiedGeometryEngine` to
support higher-level agent cognition.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from math import comb, gcd
from typing import Callable, Dict, Iterable, List, Optional, Sequence

import numpy as np


@dataclass
class GaussianSignalAnalyzer:
    """Analyse smooth Gaussian-like signals in time and frequency domains."""

    stability_tolerance: float = 1e-12

    def characterize(self, signal: Sequence[float], dt: float) -> Dict[str, float]:
        """Return basic Gaussian statistics and a Fourier-domain spread.

        Parameters
        ----------
        signal:
            Samples of the signal in the time domain.
        dt:
            Time step between samples.
        """

        samples = np.asarray(signal, dtype=float)
        if samples.ndim != 1:
            raise ValueError("Signal must be one-dimensional")

        mu = float(np.mean(samples))
        variance = float(np.var(samples))

        spectrum = np.fft.fft(samples)
        freqs = np.fft.fftfreq(samples.size, d=dt)
        power = np.abs(spectrum) ** 2
        weight = power / np.sum(power) if np.sum(power) > 0 else power
        freq_variance = float(np.sum(weight * (2 * np.pi * freqs) ** 2))

        derivative = np.gradient(samples, dt)
        derivative_fft = np.fft.fft(derivative)
        theoretical = 1j * (2 * np.pi * freqs) * spectrum
        stability = float(
            np.linalg.norm(derivative_fft - theoretical)
            / (np.linalg.norm(spectrum) + self.stability_tolerance)
        )

        return {
            "mean": mu,
            "variance": variance,
            "frequency_variance": freq_variance,
            "fourier_derivative_deviation": stability,
        }


class ArithmeticSymmetryEngine:
    """Compute number-theoretic invariants that bridge discrete and continuous scales."""

    _bernoulli_numbers: Dict[int, float] = {
        0: 1.0,
        1: -0.5,
        2: 1.0 / 6.0,
        4: -1.0 / 30.0,
        6: 1.0 / 42.0,
        8: -1.0 / 30.0,
        10: 5.0 / 66.0,
    }

    def ramanujan_sum(self, n: int, q: int) -> int:
        """Return the Ramanujan sum c_q(n)."""

        if q <= 0:
            raise ValueError("q must be positive")
        total = 0.0 + 0.0j
        for k in range(1, q + 1):
            if gcd(k, q) == 1:
                total += np.exp(2j * np.pi * k * n / q)
        return int(round(total.real))

    def _bernoulli(self, index: int) -> float:
        if index % 2 == 1 and index > 1:
            return 0.0
        return self._bernoulli_numbers.get(index, 0.0)

    def faulhaber_sum(self, n: int, p: int) -> float:
        """Evaluate Faulhaber's polynomial sum Σ k^p."""

        if n < 0:
            raise ValueError("n must be non-negative")
        if p < 0:
            raise ValueError("p must be non-negative")

        total = 0.0
        for j in range(p + 1):
            total += comb(p + 1, j) * self._bernoulli(j) * n ** (p + 1 - j)
        return total / (p + 1)

    @staticmethod
    def _prime_sieve(limit: int) -> List[int]:
        sieve = np.ones(limit + 1, dtype=bool)
        sieve[:2] = False
        for number in range(2, int(limit ** 0.5) + 1):
            if sieve[number]:
                sieve[number * number :: number] = False
        return [idx for idx, is_prime in enumerate(sieve) if is_prime]

    def euler_product(self, s: complex, limit: int = 101) -> float:
        """Approximate Euler's product for ζ(s) using primes below ``limit``."""

        if limit < 3:
            raise ValueError("limit must be at least 3")
        product = 1.0
        for prime in self._prime_sieve(limit):
            product *= 1.0 / (1.0 - prime ** (-s))
        return float(np.real(product))

    def invariants(self, n: int, p: int, q: int, s: complex) -> Dict[str, float]:
        """Return a bundle of arithmetic invariants."""

        return {
            "ramanujan": float(self.ramanujan_sum(n, q)),
            "faulhaber": float(self.faulhaber_sum(n, p)),
            "euler_product": self.euler_product(s),
        }


class ComplexMatrixMapper:
    """Convert between complex, matrix, and quaternion forms."""

    def complex_to_matrix(self, value: complex) -> np.ndarray:
        a = float(np.real(value))
        b = float(np.imag(value))
        return np.array([[a, -b], [b, a]], dtype=float)

    def matrix_to_complex(self, matrix: np.ndarray) -> complex:
        if matrix.shape != (2, 2):
            raise ValueError("Matrix must be 2x2 for complex conversion")
        return complex(matrix[0, 0], matrix[1, 0])

    def complex_to_quaternion(self, value: complex) -> np.ndarray:
        return np.array([float(np.real(value)), float(np.imag(value)), 0.0, 0.0], dtype=float)

    def quaternion_rotation_matrix(self, quaternion: Sequence[float]) -> np.ndarray:
        q = np.asarray(quaternion, dtype=float)
        if q.size != 4:
            raise ValueError("Quaternion must have four components")
        w, x, y, z = q
        return np.array(
            [
                [1 - 2 * (y ** 2 + z ** 2), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                [2 * (x * y + z * w), 1 - 2 * (x ** 2 + z ** 2), 2 * (y * z - x * w)],
                [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x ** 2 + y ** 2)],
            ],
            dtype=float,
        )


@dataclass
class QuaternionicRotationEngine:
    """Rotation kernel built on Hamilton's quaternion algebra."""

    def normalize(self, quaternion: Sequence[float]) -> np.ndarray:
        q = np.asarray(quaternion, dtype=float)
        norm = np.linalg.norm(q)
        if norm == 0:
            raise ValueError("Quaternion cannot be zero")
        return q / norm

    def from_axis_angle(self, axis: Sequence[float], angle: float) -> np.ndarray:
        axis_vec = np.asarray(axis, dtype=float)
        if axis_vec.size != 3:
            raise ValueError("Axis must be three-dimensional")
        axis_norm = np.linalg.norm(axis_vec)
        if axis_norm == 0:
            raise ValueError("Axis vector cannot be zero")
        axis_unit = axis_vec / axis_norm
        half = angle / 2.0
        return np.concatenate(([np.cos(half)], axis_unit * np.sin(half)))

    @staticmethod
    def _multiply(q1: np.ndarray, q2: np.ndarray) -> np.ndarray:
        w1, x1, y1, z1 = q1
        w2, x2, y2, z2 = q2
        return np.array(
            [
                w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
                w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
                w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
                w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
            ],
            dtype=float,
        )

    def rotate(self, vector: Sequence[float], quaternion: Sequence[float]) -> np.ndarray:
        v = np.asarray(vector, dtype=float)
        if v.size != 3:
            raise ValueError("Vector must be three-dimensional")
        q = self.normalize(quaternion)
        q_conj = np.array([q[0], -q[1], -q[2], -q[3]])
        pure = np.concatenate(([0.0], v))
        rotated = self._multiply(self._multiply(q, pure), q_conj)
        return rotated[1:]

    def octonion_extension(self, quaternion: Sequence[float]) -> np.ndarray:
        """Embed a quaternion into an octonion (adds four orthogonal axes)."""

        q = np.asarray(quaternion, dtype=float)
        if q.size != 4:
            raise ValueError("Quaternion must have four components")
        return np.concatenate((q, np.zeros(4, dtype=float)))


@dataclass
class QuantumFieldManifold:
    """Stack Schrödinger, Dirac, and Hamiltonian operators."""

    hbar: float = 1.0

    def normalize(self, psi: Sequence[complex]) -> np.ndarray:
        state = np.asarray(psi, dtype=complex)
        norm = np.linalg.norm(state)
        if norm == 0:
            raise ValueError("Quantum state cannot be zero")
        return state / norm

    def schrodinger_step(self, psi: Sequence[complex], hamiltonian: np.ndarray, dt: float) -> np.ndarray:
        state = self.normalize(psi)
        hamiltonian = np.asarray(hamiltonian, dtype=complex)
        dpsi_dt = -1j / self.hbar * hamiltonian @ state
        return self.normalize(state + dt * dpsi_dt)

    def hamiltonian_energy(self, psi: Sequence[complex], hamiltonian: np.ndarray) -> float:
        state = self.normalize(psi)
        energy = np.vdot(state, hamiltonian @ state)
        return float(np.real(energy))

    def dirac_current(self, psi: Sequence[complex], gamma_matrices: Sequence[np.ndarray]) -> float:
        state = self.normalize(psi)
        gamma0 = np.asarray(gamma_matrices[0], dtype=complex)
        current = np.vdot(state, gamma0 @ state)
        return float(np.real(current))

    def probability_density(self, psi: Sequence[complex]) -> np.ndarray:
        state = self.normalize(psi)
        return np.abs(state) ** 2


@dataclass
class MobiusParameters:
    a: complex
    b: complex
    c: complex
    d: complex

    def determinant(self) -> complex:
        return self.a * self.d - self.b * self.c


class FractalMobiusCoupler:
    """Couple Möbius transformations with Mandelbrot-style boundedness checks."""

    def __init__(self, stability_radius: float = 2.0) -> None:
        self.stability_radius = stability_radius

    def transform(self, z: complex, params: MobiusParameters) -> complex:
        if abs(params.determinant()) == 0:
            raise ValueError("Möbius parameters must satisfy ad - bc ≠ 0")
        return (params.a * z + params.b) / (params.c * z + params.d)

    def iterate(self, z0: complex, params: MobiusParameters, steps: int) -> List[complex]:
        orbit: List[complex] = [z0]
        z = z0
        for _ in range(steps):
            z = self.transform(z, params)
            orbit.append(z)
        return orbit

    def is_bounded(self, orbit: Iterable[complex]) -> bool:
        return all(abs(z) < self.stability_radius for z in orbit)


@dataclass
class NoetherAnalyzer:
    """Detect conserved currents derived from variational symmetries."""

    step: float = 1e-5

    def _gradient(self, func: Callable[[np.ndarray], float], point: np.ndarray) -> np.ndarray:
        grad = np.zeros_like(point, dtype=float)
        for idx in range(point.size):
            shift = np.zeros_like(point, dtype=float)
            shift[idx] = self.step
            grad[idx] = (func(point + shift) - func(point - shift)) / (2 * self.step)
        return grad

    def conserved_current(
        self,
        lagrangian: Callable[[np.ndarray, np.ndarray, float], float],
        q: Sequence[float],
        qdot: Sequence[float],
        symmetry: Sequence[float],
        t: float = 0.0,
    ) -> float:
        q_vec = np.asarray(q, dtype=float)
        qdot_vec = np.asarray(qdot, dtype=float)
        symmetry_vec = np.asarray(symmetry, dtype=float)

        def velocity_slice(vel: np.ndarray) -> float:
            return float(lagrangian(q_vec, vel, t))

        grad = self._gradient(velocity_slice, qdot_vec)
        return float(np.dot(grad, symmetry_vec))


@dataclass
class EntropyFieldMapper:
    """Bridge Gaussian statistics with Shannon-style entropy."""

    boltzmann_constant: float = 1.0

    def gaussian_entropy(self, sigma: float) -> float:
        sigma = float(sigma)
        if sigma <= 0:
            raise ValueError("Standard deviation must be positive")
        return float(self.boltzmann_constant * np.log(sigma * np.sqrt(2 * np.pi * np.e)))

    def from_variance(self, variance: float) -> float:
        if variance <= 0:
            raise ValueError("Variance must be positive")
        return self.gaussian_entropy(np.sqrt(variance))

    def from_samples(self, samples: Sequence[float]) -> Dict[str, float]:
        arr = np.asarray(samples, dtype=float)
        sigma = float(np.std(arr))
        return {"sigma": sigma, "entropy": self.gaussian_entropy(max(sigma, 1e-12))}


class HilbertPhaseAnalyzer:
    """Construct analytic signals via the Hilbert transform."""

    def analytic_signal(self, signal: Sequence[float]) -> np.ndarray:
        samples = np.asarray(signal, dtype=float)
        n = samples.size
        if n == 0:
            raise ValueError("Signal must contain samples")
        spectrum = np.fft.fft(samples)
        h = np.zeros(n)
        if n % 2 == 0:
            h[0] = h[n // 2] = 1.0
            h[1 : n // 2] = 2.0
        else:
            h[0] = 1.0
            h[1 : (n + 1) // 2] = 2.0
        analytic = np.fft.ifft(spectrum * h)
        return analytic

    def instantaneous_amplitude(self, signal: Sequence[float]) -> np.ndarray:
        analytic = self.analytic_signal(signal)
        return np.abs(analytic)

    def instantaneous_phase(self, signal: Sequence[float]) -> np.ndarray:
        analytic = self.analytic_signal(signal)
        return np.unwrap(np.angle(analytic))


@dataclass
class UnifiedGeometryEngine:
    """Compose all analytical subsystems for agent cognition."""

    gaussian: GaussianSignalAnalyzer = field(default_factory=GaussianSignalAnalyzer)
    arithmetic: ArithmeticSymmetryEngine = field(default_factory=ArithmeticSymmetryEngine)
    mapper: ComplexMatrixMapper = field(default_factory=ComplexMatrixMapper)
    quaternion: QuaternionicRotationEngine = field(default_factory=QuaternionicRotationEngine)
    quantum: QuantumFieldManifold = field(default_factory=QuantumFieldManifold)
    fractal: FractalMobiusCoupler = field(default_factory=FractalMobiusCoupler)
    noether: NoetherAnalyzer = field(default_factory=NoetherAnalyzer)
    entropy: EntropyFieldMapper = field(default_factory=EntropyFieldMapper)
    hilbert: HilbertPhaseAnalyzer = field(default_factory=HilbertPhaseAnalyzer)

    def analyze_signal(self, signal: Sequence[float], dt: float) -> Dict[str, np.ndarray | Dict[str, float]]:
        gaussian_metrics = self.gaussian.characterize(signal, dt)
        amplitude = self.hilbert.instantaneous_amplitude(signal)
        phase = self.hilbert.instantaneous_phase(signal)
        entropy_metrics = self.entropy.from_samples(signal)
        return {
            "gaussian": gaussian_metrics,
            "analytic_signal": {"amplitude": amplitude, "phase": phase},
            "entropy": entropy_metrics,
        }

    def symmetry_characteristics(self, n: int, p: int, q: int, s: complex) -> Dict[str, float]:
        return self.arithmetic.invariants(n, p, q, s)

    def rotate_state(self, vector: Sequence[float], axis: Sequence[float], angle: float) -> np.ndarray:
        quaternion = self.quaternion.from_axis_angle(axis, angle)
        return self.quaternion.rotate(vector, quaternion)

    def mobius_recursion(self, z0: complex, params: MobiusParameters, steps: int) -> Dict[str, object]:
        orbit = self.fractal.iterate(z0, params, steps)
        return {"orbit": orbit, "bounded": self.fractal.is_bounded(orbit)}


__all__ = [
    "ArithmeticSymmetryEngine",
    "ComplexMatrixMapper",
    "EntropyFieldMapper",
    "FractalMobiusCoupler",
    "GaussianSignalAnalyzer",
    "HilbertPhaseAnalyzer",
    "MobiusParameters",
    "NoetherAnalyzer",
    "QuaternionicRotationEngine",
    "QuantumFieldManifold",
    "UnifiedGeometryEngine",
]
