"""CLI controller for the Influence Guard Prism panel."""

import argparse
import hashlib
import json
import os
import time
from typing import Optional, Tuple

import numpy as np

from lucidia_codex import provenance_tag
from redtest4_influence_demo import influence_scores, loss_and_grad, solve_least_squares  # noqa: F401


Array = np.ndarray


def load_npz(path: str) -> Tuple[Array, Array, Optional[Array], Optional[Array]]:
    """Load dataset arrays from an NPZ archive."""
    z = np.load(path, allow_pickle=True)
    X = z["X"]
    y = z["y"].astype(float)
    prov = z["provenance"] if "provenance" in z else None
    tstamp = z["timestamp"] if "timestamp" in z else None
    return X, y, prov, tstamp


def hash_arr(arr: Array) -> str:
    """Return a stable 16-character hash for a NumPy array."""
    digest = hashlib.sha3_256(arr.tobytes()).hexdigest()
    return digest[:16]


def prov_flags(
    prov: Optional[Array],
    tstamp: Optional[Array],
    require_sig: bool = True,
    time_sigma: float = 3.0,
) -> Array:
    """Compute provenance-derived risk flags."""
    n = len(prov) if prov is not None else 0
    flags = np.zeros(n, dtype=int)
    if n == 0:
        return flags

    if require_sig:
        sig_ok = np.array([int(str(p).startswith("sig:")) for p in prov])
        flags = np.maximum(flags, 1 - sig_ok)

    if tstamp is not None:
        t = np.array(tstamp, dtype=float)
        mu = np.mean(t)
        sigma = max(np.std(t), 1e-9)
        outliers = (np.abs(t - mu) > time_sigma * sigma).astype(int)
        flags = np.maximum(flags, outliers)

    return flags


def retrain_trim(
    theta: Array,
    X: Array,
    y: Array,
    ridge: float,
    drop_idx: Array,
    steps: int = 150,
    lr: float = 0.5,
) -> Tuple[Array, Array]:
    """Retrain the model after trimming the specified indices."""
    keep = np.ones(len(y), dtype=bool)
    keep[drop_idx] = False
    updated = theta.copy()
    for _ in range(steps):
        _, grad = loss_and_grad(updated, X[keep], y[keep], reg=ridge)
        updated -= lr * grad
    return updated, keep


def main() -> None:
    """Parse CLI arguments and execute the requested action."""
    ap = argparse.ArgumentParser()
    ap.add_argument("--train", required=True)
    ap.add_argument("--test", required=True)
    ap.add_argument("--model", required=True)
    ap.add_argument("--fast-frac", type=float, default=0.02)
    ap.add_argument("--cg-tol", type=float, default=1e-6)
    ap.add_argument("--cg-iters", type=int, default=300)
    ap.add_argument("--ridge", type=float, default=1e-3)
    ap.add_argument("--quar-pct", type=float, default=0.5)
    ap.add_argument("--prov-sig", type=lambda s: s.lower() in ("1", "true", "yes"), default=True)
    ap.add_argument("--prov-sigma", type=float, default=3.0)
    ap.add_argument("--mode", choices=["trim", "cvar", "reweight"], default="trim")
    ap.add_argument(
        "--action",
        choices=["scan", "quarantine", "retrain", "forensics"],
        required=True,
    )
    args = ap.parse_args()

    Xtr, ytr, prov, tstamp = load_npz(args.train)
    Xte, yte, _, _ = load_npz(args.test)
    theta = np.load(args.model)

    baseline_loss, _ = loss_and_grad(theta, Xte, yte, reg=args.ridge)

    limit = min(64, len(yte))
    influences_before, proxy_before, grads = influence_scores(
        theta,
        Xtr,
        ytr,
        Xte[:limit],
        yte[:limit],
        reg=args.ridge,
    )
    abs_influence_before = np.abs(influences_before)
    current_influences = influences_before
    current_proxy = proxy_before
    current_abs_influence = abs_influence_before
    fast_k = max(1, int(args.fast_frac * len(ytr)))
    fast_candidates = np.argsort(-np.abs(proxy_before))[:fast_k]

    prov_flag_array = (
        prov_flags(prov, tstamp, require_sig=args.prov_sig, time_sigma=args.prov_sigma)
        if prov is not None
        else np.zeros(len(ytr), dtype=int)
    )

    risk = current_abs_influence * (1.0 + prov_flag_array)
    quarantine_n = max(1, int(args.quar_pct / 100.0 * len(ytr)))
    quarantine_indices = np.argsort(-risk)[:quarantine_n]

    output = {
        "baseline_test_loss": float(baseline_loss),
        "test_loss": float(baseline_loss),
        "max_abs_influence_before": float(abs_influence_before.max()),
        "max_abs_influence_after": float(abs_influence_before.max()),
        "median_abs_influence_before": float(np.median(abs_influence_before)),
        "median_abs_influence_after": float(np.median(abs_influence_before)),
        "max_abs_influence": float(abs_influence_before.max()),
        "median_abs_influence": float(np.median(abs_influence_before)),
        "flags_count": int((prov_flag_array > 0).sum()),
        "quarantined_count": int(len(quarantine_indices)),
        "top_indices": [int(i) for i in np.argsort(-current_abs_influence)[:10]],
        "quarantine_indices": [int(i) for i in quarantine_indices],
        "fast_filter_indices": [int(i) for i in fast_candidates],
        "model_hash": hash_arr(theta),
        "train_hash": hash_arr(Xtr),
    }

    if args.action in ("quarantine", "retrain", "forensics"):
        os.makedirs("forensics", exist_ok=True)
        quarantine_path = f"forensics/quarantine_{int(time.time())}.json"
        with open(quarantine_path, "w", encoding="utf-8") as handle:
            json.dump({"indices": output["quarantine_indices"]}, handle)

    if args.action in ("retrain", "forensics"):
        theta_retrained, _ = retrain_trim(
            theta,
            Xtr,
            ytr,
            args.ridge,
            output["quarantine_indices"],
        )
        np.save("models/theta_retrained.npy", theta_retrained)
        retrained_loss, _ = loss_and_grad(theta_retrained, Xte, yte, reg=args.ridge)
        output["test_loss_retrained"] = float(retrained_loss)
        output["test_loss"] = float(retrained_loss)
        output["model_hash_after"] = hash_arr(theta_retrained)

        influences_after, proxy_after, _ = influence_scores(
            theta_retrained,
            Xtr,
            ytr,
            Xte[:limit],
            yte[:limit],
            reg=args.ridge,
        )
        current_influences = influences_after
        current_proxy = proxy_after
        current_abs_influence = np.abs(influences_after)

        output["max_abs_influence_after"] = float(current_abs_influence.max())
        output["median_abs_influence_after"] = float(np.median(current_abs_influence))
        output["max_abs_influence"] = output["max_abs_influence_after"]
        output["median_abs_influence"] = output["median_abs_influence_after"]
        output["top_indices"] = [int(i) for i in np.argsort(-current_abs_influence)[:10]]

    if args.action == "forensics":
        bundle = {
            "incident_id": f"rt4-{int(time.time())}",
            "detected_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            "top_flags": [
                {
                    "idx": int(idx),
                    "influence": float(current_influences[idx]),
                    "proxy": float(current_proxy[idx]),
                    "prov_flag": int(prov_flag_array[idx]),
                }
                for idx in output["quarantine_indices"][:20]
            ],
            "model_hash_before": output["model_hash"],
            "model_hash_after": output.get("model_hash_after", ""),
            "actions": [
                "quarantine_samples",
                "retrain_trim",
            ]
            if "test_loss_retrained" in output
            else ["quarantine_samples"],
            "artifacts": [
                "models/theta.npy",
                "models/theta_retrained.npy",
            ]
            if "test_loss_retrained" in output
            else ["models/theta.npy"],
            "provenance_tag": provenance_tag(
                output["model_hash"].encode(), output["train_hash"].encode()
            ),
        }
        with open("forensics/bundle.json", "w", encoding="utf-8") as handle:
            json.dump(bundle, handle, indent=2)
        output["forensics_path"] = "forensics/bundle.json"

    print(json.dumps(output))


if __name__ == "__main__":
    main()
