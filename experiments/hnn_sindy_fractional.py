"""Utilities for learning Hamiltonian dynamics from data and exploring
fractional-order memory effects.

This module packages together a light-weight Hamiltonian neural network (HNN)
training loop, a sparse identification of nonlinear dynamics (SINDy) helper,
and simple fractional/complex derivative experiments.  It follows the
procedures sketched in Blocks 53-55 of the research notes so that users can
quickly plug in their laboratory trajectories and probe for conserved
structures or long-memory behavior.

Typical workflow::

    from experiments.hnn_sindy_fractional import (
        estimate_phase_space_derivatives,
        HNNTrainingConfig,
        train_hamiltonian_network,
        run_sindy_regression,
        caputo_fractional_derivative,
        fractional_damped_oscillator,
    )

    # 1) Load your measurements (positions q and momenta p).
    q, p = ...  # NumPy arrays with shape (T, d)
    dt = 1.0 / sample_rate

    # 2) Smooth and differentiate the data.
    prep = estimate_phase_space_derivatives(q, p, dt)

    # 3) Train the Hamiltonian neural network on (q, p, dq/dt, dp/dt).
    model, history = train_hamiltonian_network(prep, HNNTrainingConfig())

    # 4) Discover sparse polynomial structure via SINDy.
    sindy_models = run_sindy_regression(prep)

    # 5) Explore fractional oscillators with the recovered parameters.
    t, q_fractional = fractional_damped_oscillator(...)

The functions expose many hooks (normalization, batching, diagnostics) so the
pipeline can be adapted to new experiments without rewriting boilerplate.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
from numpy.typing import ArrayLike
from scipy.signal import savgol_filter
from sklearn.linear_model import Lasso
from sklearn.preprocessing import PolynomialFeatures
import torch
import torch.nn as nn


Array = np.ndarray
Tensor = torch.Tensor


@dataclass
class PhaseSpaceData:
    """Container for phase-space trajectories and their derivatives."""

    q: Array
    p: Array
    dq: Array
    dp: Array
    dt: float
    q_mean: Array = field(repr=False, default_factory=lambda: np.array([]))
    q_scale: Array = field(repr=False, default_factory=lambda: np.array([]))
    p_mean: Array = field(repr=False, default_factory=lambda: np.array([]))
    p_scale: Array = field(repr=False, default_factory=lambda: np.array([]))

    @property
    def dimension(self) -> int:
        return self.q.shape[1]

    @property
    def device(self) -> torch.device:
        return torch.device("cpu")


def _zscore(data: Array) -> Tuple[Array, Array, Array]:
    mean = data.mean(axis=0, keepdims=True)
    scale = data.std(axis=0, keepdims=True)
    scale[scale == 0.0] = 1.0
    normalized = (data - mean) / scale
    return normalized, mean, scale


def estimate_phase_space_derivatives(
    q: ArrayLike,
    p: Optional[ArrayLike],
    dt: float,
    window_length: int = 31,
    polyorder: int = 3,
    normalize: bool = True,
) -> PhaseSpaceData:
    """Smooth trajectories and estimate derivatives.

    Parameters
    ----------
    q, p:
        Position and momentum histories with shape ``(T, d)``.  When ``p`` is
        ``None`` the function assumes unit mass so that ``p \approx dq/dt``.
    dt:
        Sample spacing in seconds.
    window_length, polyorder:
        Parameters forwarded to ``scipy.signal.savgol_filter`` for smoothing
        and differentiation.
    normalize:
        Whether to z-score ``q`` and ``p`` (recommended for neural training).
    """

    q_arr = np.asarray(q, dtype=np.float64)
    if q_arr.ndim != 2:
        raise ValueError("q must be of shape (T, d)")
    if window_length % 2 == 0:
        window_length += 1

    q_smooth = savgol_filter(q_arr, window_length=window_length, polyorder=polyorder, axis=0)
    dq = savgol_filter(
        q_arr, window_length=window_length, polyorder=polyorder, deriv=1, delta=dt, axis=0
    )

    if p is None:
        p_arr = dq.copy()
    else:
        p_arr = np.asarray(p, dtype=np.float64)
        if p_arr.shape != q_arr.shape:
            raise ValueError("p must match q shape (T, d)")
    p_smooth = savgol_filter(p_arr, window_length=window_length, polyorder=polyorder, axis=0)
    dp = savgol_filter(
        p_arr, window_length=window_length, polyorder=polyorder, deriv=1, delta=dt, axis=0
    )

    q_norm, q_mean, q_scale = (q_smooth, np.zeros_like(q_smooth[:1]), np.ones_like(q_smooth[:1]))
    p_norm, p_mean, p_scale = (p_smooth, np.zeros_like(p_smooth[:1]), np.ones_like(p_smooth[:1]))
    dq_norm = dq
    dp_norm = dp

    if normalize:
        q_norm, q_mean, q_scale = _zscore(q_smooth)
        p_norm, p_mean, p_scale = _zscore(p_smooth)
        dq_mean = dq.mean(axis=0, keepdims=True)
        dq_std = dq.std(axis=0, keepdims=True)
        dq_std[dq_std == 0.0] = 1.0
        dq_norm = (dq - dq_mean) / dq_std

        dp_mean = dp.mean(axis=0, keepdims=True)
        dp_std = dp.std(axis=0, keepdims=True)
        dp_std[dp_std == 0.0] = 1.0
        dp_norm = (dp - dp_mean) / dp_std

    return PhaseSpaceData(
        q=q_norm.astype(np.float32),
        p=p_norm.astype(np.float32),
        dq=dq_norm.astype(np.float32),
        dp=dp_norm.astype(np.float32),
        dt=float(dt),
        q_mean=q_mean.astype(np.float32),
        q_scale=q_scale.astype(np.float32),
        p_mean=p_mean.astype(np.float32),
        p_scale=p_scale.astype(np.float32),
    )


class HamiltonianNetwork(nn.Module):
    """Simple multilayer perceptron that outputs a scalar Hamiltonian."""

    def __init__(self, dimension: int, width: int = 128, depth: int = 2):
        super().__init__()
        layers: List[nn.Module] = []
        input_dim = 2 * dimension
        for layer_idx in range(depth):
            layers.append(nn.Linear(input_dim if layer_idx == 0 else width, width))
            layers.append(nn.Tanh())
        layers.append(nn.Linear(width, 1))
        self.net = nn.Sequential(*layers)

    def forward(self, q: Tensor, p: Tensor) -> Tensor:
        features = torch.cat([q, p], dim=-1)
        return self.net(features).squeeze(-1)


@dataclass
class HNNTrainingConfig:
    """Hyperparameters controlling Hamiltonian training."""

    learning_rate: float = 1e-3
    steps: int = 5000
    batch_size: Optional[int] = None
    width: int = 128
    depth: int = 2
    weight_decay: float = 0.0
    print_every: int = 500
    detach_every: int = 50


@dataclass
class TrainingHistory:
    losses: List[float]
    dq_rmse: List[float]
    dp_rmse: List[float]


def _prepare_batches(
    data: PhaseSpaceData, batch_size: Optional[int]
) -> Iterable[Tuple[Tensor, Tensor, Tensor, Tensor]]:
    q = torch.from_numpy(data.q)
    p = torch.from_numpy(data.p)
    dq = torch.from_numpy(data.dq)
    dp = torch.from_numpy(data.dp)

    if batch_size is None or batch_size >= len(q):
        yield q, p, dq, dp
        return

    indices = torch.randperm(len(q))
    for start in range(0, len(q), batch_size):
        idx = indices[start : start + batch_size]
        yield q[idx], p[idx], dq[idx], dp[idx]


def train_hamiltonian_network(
    data: PhaseSpaceData, config: HNNTrainingConfig
) -> Tuple[HamiltonianNetwork, TrainingHistory]:
    """Train an HNN to reproduce observed phase-space derivatives."""

    model = HamiltonianNetwork(dimension=data.dimension, width=config.width, depth=config.depth)
    optimizer = torch.optim.Adam(model.parameters(), lr=config.learning_rate, weight_decay=config.weight_decay)

    losses: List[float] = []
    dq_rmse: List[float] = []
    dp_rmse: List[float] = []

    for step in range(1, config.steps + 1):
        batch_losses = []
        batch_dq = []
        batch_dp = []
        for q_batch, p_batch, dq_batch, dp_batch in _prepare_batches(data, config.batch_size):
            q_batch = q_batch.requires_grad_(True)
            p_batch = p_batch.requires_grad_(True)
            H = model(q_batch, p_batch)
            dH_dq, dH_dp = torch.autograd.grad(H.sum(), (q_batch, p_batch), create_graph=True)
            dq_pred = dH_dp
            dp_pred = -dH_dq
            residual_q = dq_pred - dq_batch
            residual_p = dp_pred - dp_batch
            loss = (residual_q.square().mean() + residual_p.square().mean())
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            batch_losses.append(loss.item())
            batch_dq.append(residual_q.detach())
            batch_dp.append(residual_p.detach())

            if config.detach_every and step % config.detach_every == 0:
                dq_pred.detach_()
                dp_pred.detach_()

        losses.append(float(np.mean(batch_losses)))
        dq_rmse.append(float(torch.cat(batch_dq).square().mean().sqrt()))
        dp_rmse.append(float(torch.cat(batch_dp).square().mean().sqrt()))

        if config.print_every and step % config.print_every == 0:
            print(f"[step {step:05d}] loss={losses[-1]:.6f} dq_rmse={dq_rmse[-1]:.6f} dp_rmse={dp_rmse[-1]:.6f}")

    return model, TrainingHistory(losses=losses, dq_rmse=dq_rmse, dp_rmse=dp_rmse)


@dataclass
class SINDyConfig:
    degree: int = 3
    alpha: float = 1e-3
    include_bias: bool = False


def run_sindy_regression(
    data: PhaseSpaceData, config: Optional[SINDyConfig] = None
) -> Dict[str, Dict[str, float]]:
    """Fit sparse polynomial dynamics to measured derivatives."""

    if config is None:
        config = SINDyConfig()
    X = np.concatenate([data.q, data.p], axis=1)
    dX = np.concatenate([data.dq, data.dp], axis=1)
    library = PolynomialFeatures(degree=config.degree, include_bias=config.include_bias)
    Phi = library.fit_transform(X)
    feature_names = library.get_feature_names_out()

    models: Dict[str, Dict[str, float]] = {}
    for idx in range(dX.shape[1]):
        target = dX[:, idx]
        lasso = Lasso(alpha=config.alpha)
        lasso.fit(Phi, target)
        state_name = f"x{idx}"
        coeff_map: Dict[str, float] = {}
        for term, weight in zip(feature_names, lasso.coef_):
            if abs(weight) > 1e-6:
                coeff_map[term] = float(weight)
        models[state_name] = coeff_map
    return models


def summarize_sindy(models: Dict[str, Dict[str, float]]) -> str:
    """Readable string representation of SINDy results."""

    lines: List[str] = []
    for state, coeffs in models.items():
        if not coeffs:
            lines.append(f"{state}: 0")
            continue
        formatted = " + ".join(f"{w:+.3e}*{term}" for term, w in coeffs.items())
        lines.append(f"{state} = {formatted}")
    return "\n".join(lines)


def caputo_fractional_derivative(signal: ArrayLike, dt: float, alpha: float) -> Array:
    """Approximate the Caputo fractional derivative using the L1 scheme."""

    if not 0.0 < alpha < 1.0:
        raise ValueError("alpha must lie in (0, 1)")
    values = np.asarray(signal, dtype=np.complex128)
    if values.ndim != 1:
        raise ValueError("signal must be one-dimensional")

    n = len(values)
    derivative = np.zeros(n, dtype=np.complex128)
    if n < 2:
        return derivative

    gamma_term = 1.0 / np.math.gamma(2.0 - alpha)
    diffs = np.diff(values) / dt

    coeff = np.zeros(n - 1)
    for k in range(n - 1):
        coeff[k] = (k + 1) ** (1.0 - alpha) - k ** (1.0 - alpha)

    for t in range(1, n):
        weights = coeff[:t][::-1]
        derivative[t] = gamma_term * dt ** (-alpha) * np.dot(weights, diffs[:t])
    return derivative


def fractional_damped_oscillator(
    q0: complex = 1.0,
    dq0: complex = 0.0,
    alpha: float = 0.8,
    zeta: float = 0.1,
    omega_0: complex = 2 * np.pi,
    duration: float = 10.0,
    dt: float = 1e-3,
) -> Tuple[Array, Array]:
    """Simulate a fractional-order damped oscillator."""

    steps = int(np.ceil(duration / dt)) + 1
    t = np.linspace(0.0, dt * (steps - 1), steps)
    q = np.zeros(steps, dtype=np.complex128)
    dq = np.zeros(steps, dtype=np.complex128)
    q[0] = q0
    dq[0] = dq0

    # Seed the fractional velocity with the derivative of the known history at t=0.
    frac_vel = caputo_fractional_derivative(q[:1], dt=dt, alpha=alpha)[0]

    for idx in range(1, steps):
        accel = -2.0 * zeta * omega_0 * frac_vel - (omega_0 ** 2) * q[idx - 1]
        dq[idx] = dq[idx - 1] + dt * accel
        q[idx] = q[idx - 1] + dt * dq[idx]

        # Update the fractional derivative now that q[idx] has been advanced so the
        # next step uses a velocity consistent with the full history.
        frac_vel = caputo_fractional_derivative(q[: idx + 1], dt=dt, alpha=alpha)[idx]
    return t, q


def conserved_quantity(model: HamiltonianNetwork, data: PhaseSpaceData) -> Array:
    """Evaluate the learned Hamiltonian along a trajectory."""

    q = torch.from_numpy(data.q)
    p = torch.from_numpy(data.p)
    with torch.no_grad():
        H = model(q, p)
    return H.cpu().numpy()


def noether_deviation(model: HamiltonianNetwork, data: PhaseSpaceData) -> float:
    """Return the standard deviation of the learned Hamiltonian."""

    H = conserved_quantity(model, data)
    return float(H.std())


def demo_simple_harmonic_oscillator(
    omega: float = 1.0, duration: float = 10.0, dt: float = 1e-2
) -> PhaseSpaceData:
    """Generate synthetic harmonic-oscillator data for quick experiments."""

    t = np.arange(0.0, duration, dt)
    q = np.stack([np.cos(omega * t)], axis=1)
    p = np.stack([-omega * np.sin(omega * t)], axis=1)
    return estimate_phase_space_derivatives(q, p, dt=dt)


__all__ = [
    "PhaseSpaceData",
    "HamiltonianNetwork",
    "HNNTrainingConfig",
    "TrainingHistory",
    "SINDyConfig",
    "estimate_phase_space_derivatives",
    "train_hamiltonian_network",
    "run_sindy_regression",
    "summarize_sindy",
    "caputo_fractional_derivative",
    "fractional_damped_oscillator",
    "conserved_quantity",
    "noether_deviation",
    "demo_simple_harmonic_oscillator",
]
