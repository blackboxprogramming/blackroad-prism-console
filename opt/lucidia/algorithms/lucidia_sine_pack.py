"""
Lucidia Sine Pack — core algorithms in one file (drop-in).

What you get (discrete-time, step dt):
  • Streaming sine-memory with exponentially-fading kernels
  • Phase/amplitude extraction (analytic signal via FFT Hilbert)
  • Feeling F_t  = phase-coherence(state vs. memory)
  • Love   L_t   = discounted long-horizon coherence (EMA)
  • Phi    Φ_t   = spectral integration (joint vs. parts entropy)
  • Contradiction monitor + evolution (auto-add/retune sine bases)
  • Minimal, pure-NumPy implementation, no external deps

Usage:
    import numpy as np
    from lucidia_sine_pack import LucidiaSine

    luc = LucidiaSine(n_dims=4, dt=0.01, K=6, tau=0.5)

    for t in range(10000):
        x_t = np.random.randn(4) * 0.1
        out = luc.update(x_t)
        # Optionally supervise to drive evolution:
        # luc.notify_supervision(y_hat=out["M_t"], y_true=np.zeros_like(out["M_t"]))
        # Access metrics:
        # out["F_t"], out["L_t"], out["Phi_spec"]

All state persists inside the object. To save/load across runs, use:
    luc.save_state("/opt/lucidia/state/lucidia_sine_state.npz")
    luc2 = LucidiaSine.load_state("/opt/lucidia/state/lucidia_sine_state.npz")

File is nano/copy-paste ready.
"""
from __future__ import annotations
import os
import io
import math
import json
import numpy as np
from dataclasses import dataclass, asdict
from typing import Dict, Tuple, Optional


# ------------------------------- helpers ------------------------------------ #

def _next_pow2(n: int) -> int:
    p = 1
    while p < n:
        p <<= 1
    return p


def _hilbert_analytic(x: np.ndarray) -> np.ndarray:
    """
    Return analytic signal z = x + j*H{x} using FFT-based Hilbert transform.
    Works for 1D vectors. For 2D (channels x time), apply row-wise.
    """
    x = np.asarray(x, dtype=float)
    N = x.shape[-1]
    # Zero-pad to power-of-two for speed; keep last index mapping simple.
    N2 = _next_pow2(N)
    X = np.fft.rfft(x, n=N2)
    # Build frequency-domain multiplier for analytic signal:
    # For real FFT: bins 0..N2//2 inclusive. Double positive freqs (exclude DC & Nyquist).
    H = np.ones_like(X, dtype=complex)
    if N2 > 2:
        H[1:-1] *= 2.0
    z_full = np.fft.irfft(X * H, n=N2)
    return z_full[:N]


def _spectral_entropy(power: np.ndarray, eps: float = 1e-12) -> float:
    """
    Shannon entropy over a (nonnegative) power spectrum (1D array).
    Normalized to probability mass; return scalar entropy in nats.
    """
    p = np.maximum(power, 0.0)
    s = p.sum()
    if s <= eps:
        return 0.0
    p /= s
    p = np.clip(p, eps, 1.0)
    return float(-(p * np.log(p)).sum())


def _periodogram(signal: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Simple periodogram (magnitude^2 of FFT). Returns (freq_bins_rad, power).
    signal: 1D array (time).
    """
    N = len(signal)
    N2 = _next_pow2(N)
    # Real FFT up to Nyquist
    S = np.fft.rfft(signal, n=N2)
    power = (S.real ** 2 + S.imag ** 2)
    # Angular frequencies for rfft bins: 0..pi
    freqs = np.linspace(0.0, math.pi, len(power))
    return freqs, power


# ------------------------------- main class --------------------------------- #

@dataclass
class LucidiaConfig:
    n_dims: int
    dt: float                # time step
    K: int = 6               # number of sine bases
    tau: float = 0.5         # exponential fading time-constant (seconds)
    H_factor: float = 5.0    # history length ≈ H_factor * tau
    max_K: int = 24          # cap for evolution
    ema_gamma: float = 0.98  # L_t update: L_t = gamma*L_{t-1} + (1-gamma)*F_t
    contradiction_patience: int = 64
    error_threshold: float = 1e-2
    min_freq: float = 2.0    # rad/s (avoid near-DC for sine bases)
    max_freq: float = 200.0  # rad/s (cap)
    seed: Optional[int] = 7


class LucidiaSine:
    """
    Streaming sine-memory + feelings + love + spectral-phi + evolution.
    """

    def __init__(self, n_dims: int, dt: float, K: int = 6, tau: float = 0.5,
                 H_factor: float = 5.0, max_K: int = 24, ema_gamma: float = 0.98,
                 contradiction_patience: int = 64, error_threshold: float = 1e-2,
                 min_freq: float = 2.0, max_freq: float = 200.0, seed: Optional[int] = 7):
        self.cfg = LucidiaConfig(
            n_dims=n_dims, dt=dt, K=K, tau=tau, H_factor=H_factor, max_K=max_K,
            ema_gamma=ema_gamma, contradiction_patience=contradiction_patience,
            error_threshold=error_threshold, min_freq=min_freq, max_freq=max_freq, seed=seed
        )
        self._rng = np.random.default_rng(seed)

        # History horizon (samples)
        H = max(32, int(math.ceil((H_factor * tau) / dt)))
        # round to next power of two for FFT efficiency/clean windows
        self.H = _next_pow2(H)

        # Ring buffers (channels x H)
        self._buf = np.zeros((n_dims, self.H), dtype=float)     # raw state history
        self._ybuf = np.zeros((n_dims, self.H), dtype=float)    # memory output history
        self._rbuf = np.zeros(self.H, dtype=float)              # residual (for contradiction)
        self._ptr = 0

        # Initialize basis params
        self.K = int(K)
        self.max_K = int(max_K)

        # Spread initial frequencies across a log band (rad/s)
        fmin = max(min_freq, 2.0)
        fmax = max(fmin * 1.5, max_freq)
        w0 = np.geomspace(fmin, fmax, num=self.K)
        self.omega = w0.copy()                  # shape (K,)
        self.phi = self._rng.uniform(-math.pi, math.pi, size=self.K)
        self.amp = 0.25 * self._rng.standard_normal(self.K)     # small at start

        # Precompute kernels (K x H)
        self._kernels = self._build_kernels()

        # Rolling stats
        self._L = 0.0
        self._contrad_streak = 0

    # -------------------------- kernel & buffers ---------------------------- #

    def _build_kernels(self) -> np.ndarray:
        """Build exponentially-fading sine kernels for all bases: (K x H)."""
        t = np.arange(self.H) * self.cfg.dt
        decay = np.exp(-t / max(self.cfg.tau, 1e-6))
        kernels = []
        for k in range(self.K):
            kernels.append(decay * np.sin(self.omega[k] * t + self.phi[k]))
        return np.stack(kernels, axis=0)  # (K, H)

    def _advance_ptr(self):
        self._ptr = (self._ptr + 1) % self.H

    def _write_buf(self, x_t: np.ndarray):
        self._buf[:, self._ptr] = x_t

    def _read_tail(self, src: np.ndarray) -> np.ndarray:
        """
        Return a (n_dims x H) view of 'src' ordered oldest→newest (tail-aligned).
        """
        idx = (np.arange(self.H) + self._ptr + 1) % self.H
        return src[:, idx]

    # ------------------------------ API ------------------------------------ #

    def update(self, x_t: np.ndarray) -> Dict[str, np.ndarray | float]:
        """
        Ingest one time step (vector) and update all metrics.
        Returns:
            M_t        : (n_dims,) memory output at time t
            F_t        : scalar phase-coherence
            L_t        : scalar love (discounted)
            Phi_spec   : scalar spectral integration
            state_dump : small dict of current basis params
        """
        x_t = np.asarray(x_t, dtype=float).reshape(self.cfg.n_dims)
        self._advance_ptr()
        self._write_buf(x_t)

        # Current history (oldest→newest)
        X = self._read_tail(self._buf)  # (n_dims, H)

        # Convolution with kernels to produce memory outputs y_t for each channel
        # For per-t output, we only need the last aligned dot, but we also keep
        # y-history by storing only the last scalar per update into ybuf ring.
        # Compute dot for each basis then sum with amplitudes.
        # For speed: do basis*history as (K,H)·(H,) per channel.
        # We'll compute last dot: kernel[-H:]·X_channel[-H:]
        # (Since kernels are aligned oldest→newest to match X).
        KH = self._kernels  # (K, H)
        # memory scalar per channel at time t:
        M_t = (self.amp @ (KH @ X.T)).astype(float)  # ((K,H)@(H,n)) → (K,n) → amp· → (n,)
        M_t = M_t.reshape(self.cfg.n_dims)

        # Store M_t in y-history buffer
        self._ybuf[:, self._ptr] = M_t

        # Phase & amplitude via analytic signals over trailing window
        Y = self._read_tail(self._ybuf)
        # Compute analytic for each channel; take the last sample phase
        theta_x = np.zeros(self.cfg.n_dims, dtype=float)
        theta_y = np.zeros(self.cfg.n_dims, dtype=float)
        for i in range(self.cfg.n_dims):
            zx = _hilbert_analytic(X[i])
            zy = _hilbert_analytic(Y[i])
            # Instantaneous phase at newest time index (-1)
            theta_x[i] = math.atan2(float(zx[-1].imag), float(zx[-1].real))
            theta_y[i] = math.atan2(float(zy[-1].imag), float(zy[-1].real))

        # Feeling = mean phase alignment cos(Δθ)
        F_t = float(np.mean(np.cos(theta_x - theta_y)))

        # Love = EMA of feelings (discounted long-horizon)
        g = float(self.cfg.ema_gamma)
        self._L = g * self._L + (1.0 - g) * F_t

        # Spectral Phi (integration): entropy(joint) - sum entropy(parts)
        # Use raw state X; joint = sum across channels
        Nfft = self.H
        joint = X.sum(axis=0)
        _, P_joint = _periodogram(joint[-Nfft:])
        H_joint = _spectral_entropy(P_joint)
        H_parts = 0.0
        for i in range(self.cfg.n_dims):
            _, P_i = _periodogram(X[i, -Nfft:])
            H_parts += _spectral_entropy(P_i)
        Phi_spec = float(H_joint - H_parts)

        # Small state dump
        state_dump = {
            "K": int(self.K),
            "omega": self.omega.copy(),
            "phi": self.phi.copy(),
            "amp": self.amp.copy(),
        }

        return {
            "M_t": M_t,
            "F_t": F_t,
            "L_t": float(self._L),
            "Phi_spec": Phi_spec,
            "state_dump": state_dump,
        }

    # ------------------- supervision / contradiction loop ------------------- #

    def notify_supervision(self, y_hat: np.ndarray, y_true: np.ndarray):
        """
        Provide supervised signal to drive evolution. We accumulate residuals
        and trigger add/retune of a sine basis if error persists.
        y_hat, y_true: vectors (n_dims,)
        """
        y_hat = np.asarray(y_hat, dtype=float).reshape(self.cfg.n_dims)
        y_true = np.asarray(y_true, dtype=float).reshape(self.cfg.n_dims)
        err = float(np.mean((y_true - y_hat) ** 2))

        # Push scalar residual into ring residual buffer:
        self._rbuf[self._ptr] = err

        # Rolling MSE over window
        E = float(np.mean(self._read_tail(self._rbuf)[-1]))  # last write; cheap placeholder
        # Better: MSE over full residual window
        E = float(np.mean(self._rbuf))

        if E > self.cfg.error_threshold:
            self._contrad_streak += 1
        else:
            self._contrad_streak = 0

        if self._contrad_streak >= self.cfg.contradiction_patience:
            self._contrad_streak = 0
            self._evolve_frequency()

    def _evolve_frequency(self):
        """
        Add a new frequency (or retune weakest) based on residual spectrum.
        Strategy:
          1) Build residual proxy r(t): here we use the recent joint raw residual proxy:
             r ≈ mean over channels of (x - y) magnitude. If not available, we
             reuse the stored residual errors and state to pick a strong freq band.
          2) Choose peak frequency from periodogram (exclude near-DC).
          3) If K < max_K: append new basis; else retune the smallest |amp| basis.
        """
        # Build a simple residual proxy from state vs. memory outputs:
        X = self._read_tail(self._buf)
        Y = self._read_tail(self._ybuf)
        r = np.mean(X - Y, axis=0)  # shape (H,)

        freqs, power = _periodogram(r)
        # Exclude very low bins (avoid DC); choose top peak
        low_cut = max(2, int(0.01 * len(freqs)))  # skip ~1% lowest freqs
        k_peak = int(np.argmax(power[low_cut:])) + low_cut
        w_peak = float(freqs[k_peak]) / max(self.cfg.dt, 1e-9)  # rad/s scaled by dt from FFT rad/bin

        # Clamp to allowed band
        w_peak = float(np.clip(w_peak, self.cfg.min_freq, self.cfg.max_freq))

        if self.K < self.max_K:
            # Append
            self.omega = np.append(self.omega, w_peak)
            self.phi = np.append(self.phi, self._rng.uniform(-math.pi, math.pi))
            self.amp = np.append(self.amp, 0.0)
            self.K += 1
        else:
            # Retune the weakest-amplitude basis
            idx = int(np.argmin(np.abs(self.amp)))
            self.omega[idx] = w_peak
            self.phi[idx] = self._rng.uniform(-math.pi, math.pi)
            self.amp[idx] *= 0.5  # gentle reset

        # Rebuild kernels after change
        self._kernels = self._build_kernels()

    # ---------------------------- persistence ------------------------------- #

    def state_dict(self) -> Dict:
        d = asdict(self.cfg)
        d.update({
            "_ptr": self._ptr,
            "H": self.H,
            "_buf": self._buf,
            "_ybuf": self._ybuf,
            "_rbuf": self._rbuf,
            "K": self.K,
            "omega": self.omega,
            "phi": self.phi,
            "amp": self.amp,
            "_L": self._L,
            "_contrad_streak": self._contrad_streak,
        })
        return d

    @staticmethod
    def from_state(d: Dict) -> "LucidiaSine":
        cfg = LucidiaConfig(
            n_dims=int(d["n_dims"]), dt=float(d["dt"]), K=int(d["K"]),
            tau=float(d["tau"]), H_factor=float(d["H_factor"]),
            max_K=int(d["max_K"]), ema_gamma=float(d["ema_gamma"]),
            contradiction_patience=int(d["contradiction_patience"]),
            error_threshold=float(d["error_threshold"]),
            min_freq=float(d["min_freq"]), max_freq=float(d["max_freq"]),
            seed=(d.get("seed", None))
        )
        obj = LucidiaSine(
            n_dims=cfg.n_dims, dt=cfg.dt, K=cfg.K, tau=cfg.tau,
            H_factor=cfg.H_factor, max_K=cfg.max_K, ema_gamma=cfg.ema_gamma,
            contradiction_patience=cfg.contradiction_patience,
            error_threshold=cfg.error_threshold, min_freq=cfg.min_freq,
            max_freq=cfg.max_freq, seed=cfg.seed
        )
        # overwrite ring sizes and states carefully
        obj.H = int(d["H"])
        obj._buf = np.array(d["_buf"], dtype=float)
        obj._ybuf = np.array(d["_ybuf"], dtype=float)
        obj._rbuf = np.array(d["_rbuf"], dtype=float)
        obj._ptr = int(d["_ptr"])
        obj.K = int(d["K"])
        obj.omega = np.array(d["omega"], dtype=float)
        obj.phi = np.array(d["phi"], dtype=float)
        obj.amp = np.array(d["amp"], dtype=float)
        obj._L = float(d["_L"])
        obj._contrad_streak = int(d["_contrad_streak"])
        obj._kernels = obj._build_kernels()
        return obj

    def save_state(self, path: str):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        np.savez_compressed(path,
            **{
                **asdict(self.cfg),
                "_ptr": self._ptr,
                "H": self.H,
                "_buf": self._buf,
                "_ybuf": self._ybuf,
                "_rbuf": self._rbuf,
                "K": self.K,
                "omega": self.omega,
                "phi": self.phi,
                "amp": self.amp,
                "_L": self._L,
                "_contrad_streak": self._contrad_streak,
            }
        )

    @staticmethod
    def load_state(path: str) -> "LucidiaSine":
        with np.load(path, allow_pickle=True) as z:
            d = {k: z[k].item() if z[k].shape == () else z[k] for k in z.files}
        return LucidiaSine.from_state(d)


# ------------------------------ minimal demo ------------------------------- #

if __name__ == "__main__":
    # Quick self-test: 2D signal made of two drifting sines plus noise
    dt = 0.01
    T = 5.0
    n = int(T / dt)
    t = np.arange(n) * dt

    x = np.zeros((2, n))
    x[0] = 0.8 * np.sin(2 * math.pi * 3.0 * t) + 0.05 * np.random.randn(n)
    x[1] = 0.6 * np.sin(2 * math.pi * 5.0 * t + 0.7) + 0.05 * np.random.randn(n)

    luc = LucidiaSine(n_dims=2, dt=dt, K=4, tau=0.6, ema_gamma=0.99, error_threshold=1e-3)

    for i in range(n):
        out = luc.update(x[:, i])
        if (i+1) % 200 == 0:
            print(f"t={t[i]:.2f}s  F={out['F_t']:+.3f}  L={out['L_t']:+.3f}  Φ={out['Phi_spec']:+.3f}  K={out['state_dump']['K']}")
