#!/usr/bin/env python3
"""Red-team trial 4: poisoned high-influence samples simulation."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from typing import Dict, List

import numpy as np


@dataclass
class TrialResult:
    """Structured output for the poisoned high-influence trial."""

    ridge: float
    cooks_ratio: float
    cooks_threshold: float
    flagged: bool
    max_cooks: float
    median_cooks: float
    high_influence_indices: List[int]
    mitigation_effect: float
    mse_before: float
    mse_after: float
    poison_indices: List[int]

    def to_dict(self) -> Dict[str, float | bool | List[int]]:
        """Convert the dataclass into a serialisable dictionary."""

        return {
            "ridge": self.ridge,
            "cooks_ratio": self.cooks_ratio,
            "cooks_threshold": self.cooks_threshold,
            "flagged": self.flagged,
            "max_cooks": self.max_cooks,
            "median_cooks": self.median_cooks,
            "high_influence_indices": self.high_influence_indices,
            "mitigation_effect": self.mitigation_effect,
            "mse_before": self.mse_before,
            "mse_after": self.mse_after,
            "poison_indices": self.poison_indices,
        }


def generate_dataset(seed: int, roadie: bool) -> Dict[str, np.ndarray]:
    """Generate a regression dataset with poisoned high-influence samples."""

    rng = np.random.default_rng(seed)
    n_clean = 120 if not roadie else 48
    n_poison = 6 if not roadie else 3
    n_features = 3

    w_true = np.array([0.5, -1.2, 2.0])

    x_clean = rng.normal(0.0, 1.0, size=(n_clean, n_features))
    noise = rng.normal(0.0, 0.3, size=n_clean)
    y_clean = x_clean @ w_true + noise

    x_poison = rng.normal(0.0, 1.0, size=(n_poison, n_features))
    leverage_boost = 12.0 if not roadie else 7.5
    x_poison[:, 0] += leverage_boost
    label_shift = 15.0 if not roadie else 10.0
    y_poison = x_poison @ w_true + rng.normal(0.0, 0.05, size=n_poison) + label_shift

    x = np.vstack([x_clean, x_poison])
    y = np.concatenate([y_clean, y_poison])

    # Keep track of indices for poisoned points to assist with forensics.
    poison_indices = list(range(n_clean, n_clean + n_poison))

    return {"x": x, "y": y, "poison_indices": poison_indices}


def add_bias(x: np.ndarray) -> np.ndarray:
    """Append a bias column to the design matrix."""

    bias = np.ones((x.shape[0], 1))
    return np.hstack([bias, x])


def fit_ridge_regression(x: np.ndarray, y: np.ndarray, ridge: float) -> np.ndarray:
    """Fit ridge regression using the closed-form solution."""

    xtx = x.T @ x
    identity = np.eye(xtx.shape[0])
    weights = np.linalg.solve(xtx + ridge * identity, x.T @ y)
    return weights


def cooks_distance(x: np.ndarray, y: np.ndarray, weights: np.ndarray) -> Dict[str, np.ndarray]:
    """Compute Cook's distance for each sample."""

    y_hat = x @ weights
    residuals = y - y_hat
    n_samples, n_params = x.shape

    mse = np.sum(residuals**2) / (n_samples - n_params)
    xtx_inv = np.linalg.inv(x.T @ x)
    hat_diag = np.einsum("ij,jk,ik->i", x, xtx_inv, x)
    stability = np.clip(1.0 - hat_diag, 1e-6, None)

    cooks = (residuals**2 / (n_params * mse)) * (hat_diag / (stability**2))
    return {"cooks": cooks, "mse": mse, "residuals": residuals}


def evaluate_trial(
    ridge: float,
    cooks_threshold: float,
    seed: int,
    roadie: bool,
    top_k: int,
) -> TrialResult:
    """Run the poisoned high-influence detection and mitigation sequence."""

    dataset = generate_dataset(seed=seed, roadie=roadie)
    x_raw = dataset["x"]
    y = dataset["y"]
    poison_indices = dataset["poison_indices"]

    x = add_bias(x_raw)
    weights = fit_ridge_regression(x, y, ridge=ridge)
    cooks_data = cooks_distance(x, y, weights)
    cooks_values = cooks_data["cooks"]

    max_cooks = float(np.max(cooks_values))
    median_cooks = float(np.median(cooks_values))
    ratio = max_cooks / (median_cooks + 1e-12)
    flagged = ratio > cooks_threshold

    top_indices = np.argsort(cooks_values)[-top_k:][::-1]
    mitigation_mask = np.ones(x.shape[0], dtype=bool)
    mitigation_mask[top_indices] = False
    x_mitigated = x[mitigation_mask]
    y_mitigated = y[mitigation_mask]

    mitigated_weights = fit_ridge_regression(x_mitigated, y_mitigated, ridge=ridge)
    mse_before = float(cooks_data["mse"])
    mse_after = float(np.sum((y_mitigated - x_mitigated @ mitigated_weights) ** 2) /
                     (x_mitigated.shape[0] - x_mitigated.shape[1]))

    mitigation_effect = (mse_before - mse_after) / (mse_before + 1e-12)

    return TrialResult(
        ridge=ridge,
        cooks_ratio=float(ratio),
        cooks_threshold=cooks_threshold,
        flagged=flagged,
        max_cooks=max_cooks,
        median_cooks=median_cooks,
        high_influence_indices=[int(i) for i in top_indices],
        mitigation_effect=float(mitigation_effect),
        mse_before=mse_before,
        mse_after=mse_after,
        poison_indices=[int(i) for i in poison_indices],
    )


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""

    parser = argparse.ArgumentParser(
        description="Run the red-team poisoned high-influence samples trial.",
    )
    parser.add_argument("--ridge", type=float, default=1e-3, help="Ridge regularisation strength.")
    parser.add_argument(
        "--cooks-threshold",
        type=float,
        default=12.0,
        help="Ratio threshold of max Cook's distance to median for flagging.",
    )
    parser.add_argument("--seed", type=int, default=7, help="Random seed for reproducibility.")
    parser.add_argument(
        "--roadie",
        action="store_true",
        help="Run in Roadie mode with fewer samples and smaller perturbations.",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=3,
        help="Number of high-influence samples to remove during mitigation.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON for ingestion by dashboards or logs.",
    )
    return parser.parse_args()


def main() -> None:
    """Entry point for running the trial."""

    args = parse_args()
    result = evaluate_trial(
        ridge=args.ridge,
        cooks_threshold=args.cooks_threshold,
        seed=args.seed,
        roadie=args.roadie,
        top_k=args.top_k,
    )

    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print("Trial 4 — Poisoned High-Influence Samples")
        print(f"ridge={result.ridge:.3e}  ratio={result.cooks_ratio:.2f}  "
              f"threshold={result.cooks_threshold:.2f}  flagged={result.flagged}")
        print(f"max_cooks={result.max_cooks:.3f} median_cooks={result.median_cooks:.3f}")
        print(f"high_influence_indices={result.high_influence_indices}")
        print(f"mitigation_effect={result.mitigation_effect:.2%}  "
              f"mse_before={result.mse_before:.4f}  mse_after={result.mse_after:.4f}")
        print("poison_indices (ground truth)",
              result.poison_indices if not args.json else "hidden")


if __name__ == "__main__":
    main()
