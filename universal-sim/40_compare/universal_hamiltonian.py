"""Universal Hamiltonian simulator for lattice-style systems.

This module implements a lightweight *digital twin* that can emulate a range
of Hamiltonian dynamics – from LC networks to photonic lattices or mechanical
chains – simply by changing the coupling matrix and drive parameters.  The
implementation follows a symplectic leapfrog integrator so that energy is
approximately conserved even across long integration horizons, making it
well-suited for exploratory studies before committing to hardware builds.

Example
-------
>>> import jax.numpy as jnp
>>> from universal_hamiltonian import (  # doctest: +SKIP
...     CoupledHamiltonian,
...     simulate,
...     plot_time_series,
... )
>>>
>>> n = 4
>>> k = 1.0
>>> base_K = k * (2 * jnp.eye(n)
...               - jnp.diag(jnp.ones(n - 1), 1)
...               - jnp.diag(jnp.ones(n - 1), -1))
>>> base_K = base_K.at[0, 0].set(1.0)
>>> base_K = base_K.at[-1, -1].set(1.0)
>>> system = CoupledHamiltonian(K=base_K, omega=jnp.zeros(n))
>>> q0 = jnp.array([1.0, 0.0, 0.0, 0.0])
>>> p0 = jnp.zeros(n)
>>> ts, qs, ps = simulate(system, q0, p0, dt=0.01, steps=1000)

For additional intuition, call :func:`plot_time_series` or
:func:`plot_heatmap` on the returned trajectories.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Tuple

import jax
import jax.numpy as jnp
import matplotlib.pyplot as plt

Array = jax.Array


@dataclass(frozen=True)
class TimeModulation:
    """Sinusoidal modulation of the coupling matrix.

    Attributes
    ----------
    delta_K:
        Matrix describing the change in coupling strength.  The instantaneous
        stiffness/coupling matrix is ``K + sin(2π t / period) * delta_K``.
    period:
        Modulation period, measured in the same units as the integration
        timestep.
    phase:
        Optional phase offset (radians) applied inside the sine argument.
    """

    delta_K: Array
    period: float
    phase: float = 0.0


@dataclass(frozen=True)
class CoupledHamiltonian:
    """Parameters describing a quadratic Hamiltonian lattice.

    Parameters
    ----------
    K:
        Base coupling matrix.  Diagonal terms define on-site frequencies while
        off-diagonal entries encode coupling strengths.
    omega:
        Linear term vector.  In electrical or mechanical systems this acts as
        a static forcing; in photonic lattices it can encode detunings.
    modulation:
        Optional :class:`TimeModulation` to model time-varying couplings.
    damping:
        Scalar damping factor :math:`γ` applied to the momentum update each
        step via ``p ← (1 - γ Δt) p``.  Set to zero for conservative systems.
    forcing:
        Optional callable returning a forcing vector ``f(t)`` evaluated at the
        current simulation time.  Useful for driven oscillators or pumped
        waveguides.
    disorder:
        Static diagonal disorder vector added to the base matrix ``K``.
    topology_alternation:
        If provided, scales every second off-diagonal entry to emulate Su–
        Schrieffer–Heeger style alternating couplings.  Values greater than 1
        strengthen the odd bonds while smaller values weaken them.
    """

    K: Array
    omega: Array
    modulation: TimeModulation | None = None
    damping: float = 0.0
    forcing: Callable[[float], Array] | None = None
    disorder: Array | None = None
    topology_alternation: float | None = None

    def effective_K(self, t: float) -> Array:
        """Return the stiffness matrix at time ``t``."""

        K = self.K
        if self.disorder is not None:
            K = K + jnp.diag(self.disorder)
        if self.topology_alternation is not None and K.shape[0] > 1:
            scale = self.topology_alternation
            indices = jnp.arange(K.shape[0] - 1)
            mask = (indices % 2 == 1).astype(K.dtype) * (scale - 1.0) + 1.0
            K = K.at[jnp.arange(K.shape[0] - 1), jnp.arange(1, K.shape[0])].multiply(mask)
            K = K.at[jnp.arange(1, K.shape[0]), jnp.arange(K.shape[0] - 1)].multiply(mask)
        if self.modulation is not None:
            omega = 2.0 * jnp.pi / self.modulation.period
            K = K + jnp.sin(omega * t + self.modulation.phase) * self.modulation.delta_K
        return K

    def effective_omega(self, t: float) -> Array:
        """Return the linear forcing vector at time ``t``."""

        base = self.omega
        if self.forcing is not None:
            base = base + self.forcing(t)
        return base


def hamiltonian(q: Array, p: Array, system: CoupledHamiltonian, t: float) -> Array:
    """Compute the Hamiltonian energy for state ``(q, p)`` at time ``t``."""

    K_t = system.effective_K(t)
    omega_t = system.effective_omega(t)
    kinetic = 0.5 * jnp.sum(p**2)
    potential = 0.5 * q @ K_t @ q
    drive = jnp.sum(omega_t * q)
    return kinetic + potential + drive


def gradients(q: Array, p: Array, system: CoupledHamiltonian, t: float) -> Tuple[Array, Array]:
    """Return ``∂H/∂q`` and ``∂H/∂p`` for state ``(q, p)`` at time ``t``."""

    K_t = system.effective_K(t)
    omega_t = system.effective_omega(t)
    dHdq = K_t @ q + omega_t
    dHdp = p
    return dHdq, dHdp


def leapfrog_step(q: Array, p: Array, system: CoupledHamiltonian, t: float, dt: float) -> Tuple[Array, Array]:
    """Perform a symplectic leapfrog step."""

    dHdq, dHdp = gradients(q, p, system, t)
    damping_term = 1.0 - system.damping * dt
    p_half = damping_term * (p - 0.5 * dt * dHdq)
    q_new = q + dt * dHdp
    dHdq_new, _ = gradients(q_new, p_half, system, t + dt)
    p_new = damping_term * (p_half - 0.5 * dt * dHdq_new)
    return q_new, p_new


def simulate(
    system: CoupledHamiltonian,
    q0: Array,
    p0: Array,
    *,
    dt: float,
    steps: int,
) -> Tuple[Array, Array, Array]:
    """Integrate the system and return times, positions, and momenta.

    Parameters
    ----------
    system:
        :class:`CoupledHamiltonian` describing the lattice.
    q0, p0:
        Initial canonical coordinates.  These may encode voltages/currents,
        displacements/momenta, or field amplitudes depending on interpretation.
    dt:
        Integration timestep.
    steps:
        Number of integration steps to run.

    Returns
    -------
    times, qs, ps:
        Timestamps, generalized positions, and momenta respectively.
    """

    def body(carry: Tuple[Array, Array, float], _: int) -> Tuple[Tuple[Array, Array, float], Tuple[Array, Array, float]]:
        q, p, t = carry
        q_new, p_new = leapfrog_step(q, p, system, t, dt)
        t_new = t + dt
        return (q_new, p_new, t_new), (t_new, q_new, p_new)

    initial = (q0, p0, 0.0)
    (_, _, _), history = jax.lax.scan(body, initial, jnp.arange(steps))
    times, qs, ps = history
    times = jnp.concatenate([jnp.array([0.0]), times])
    qs = jnp.vstack([q0, qs])
    ps = jnp.vstack([p0, ps])
    return times, qs, ps


def plot_time_series(times: Array, qs: Array, *, offset: float = 1.5, ax: plt.Axes | None = None) -> plt.Axes:
    """Plot modal amplitudes as stacked time series."""

    if ax is None:
        _, ax = plt.subplots(figsize=(7, 4))
    for idx in range(qs.shape[1]):
        ax.plot(times, qs[:, idx] + offset * idx, lw=1.0, label=f"mode {idx}")
    ax.set_xlabel("time (or propagation z)")
    ax.set_ylabel("mode amplitudes (offset)")
    ax.set_title("Coupled-mode propagation / oscillations")
    return ax


def plot_heatmap(times: Array, qs: Array, *, ax: plt.Axes | None = None) -> plt.Axes:
    """Plot a heatmap of mode amplitudes over time."""

    if ax is None:
        _, ax = plt.subplots(figsize=(7, 3.5))
    im = ax.imshow(qs.T, aspect="auto", cmap="inferno", extent=[float(times[0]), float(times[-1]), qs.shape[1] - 0.5, -0.5])
    ax.set_xlabel("time step")
    ax.set_ylabel("node index")
    ax.set_title("Energy flow across lattice")
    plt.colorbar(im, ax=ax, label="amplitude")
    return ax


__all__ = [
    "CoupledHamiltonian",
    "TimeModulation",
    "hamiltonian",
    "gradients",
    "leapfrog_step",
    "plot_heatmap",
    "plot_time_series",
    "simulate",
]

