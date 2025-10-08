"""Roadie-friendly logistic regression influence demo.

This script trains a small logistic regression model, plants a few poisoned
points, and computes both proxy and Hessian-based influence scores to surface
high-leverage samples. Runs offline with NumPy only.
"""

from __future__ import annotations

import numpy as np
from math import sqrt

np.random.seed(1)


def sigmoid(z: np.ndarray) -> np.ndarray:
    """Numerically stable sigmoid."""

    return 1.0 / (1.0 + np.exp(-z))


def loss_and_grad(
    theta: np.ndarray,
    X: np.ndarray,
    y: np.ndarray,
    reg: float = 1e-3,
) -> tuple[float, np.ndarray]:
    """Compute logistic loss and gradient with L2 regularization."""

    z = X.dot(theta)
    p = sigmoid(z)
    eps = 1e-12
    loss = -np.mean(y * np.log(p + eps) + (1 - y) * np.log(1 - p + eps))
    loss += 0.5 * reg * np.sum(theta * theta)
    grad = X.T.dot(p - y) / X.shape[0] + reg * theta
    return loss, grad


def hv_finite(
    theta: np.ndarray,
    v: np.ndarray,
    X: np.ndarray,
    y: np.ndarray,
    reg: float = 1e-3,
    eps: float = 1e-5,
) -> np.ndarray:
    """Approximate Hessian-vector product using symmetric finite differences."""

    _, g1 = loss_and_grad(theta + eps * v, X, y, reg)
    _, g0 = loss_and_grad(theta - eps * v, X, y, reg)
    return (g1 - g0) / (2 * eps)


def cg_solve(
    hv_fn,
    b: np.ndarray,
    tol: float = 1e-6,
    maxiter: int = 200,
) -> np.ndarray:
    """Conjugate gradient solver for symmetric positive definite systems."""

    x = np.zeros_like(b)
    r = b.copy()
    p = r.copy()
    rsold = r.dot(r)
    for _ in range(maxiter):
        hp = hv_fn(p)
        denom = p.dot(hp) + 1e-12
        alpha = rsold / denom
        x += alpha * p
        r -= alpha * hp
        rsnew = r.dot(r)
        if sqrt(rsnew) < tol:
            break
        p = r + (rsnew / rsold) * p
        rsold = rsnew
    return x


def influence_scores(
    theta: np.ndarray,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    reg: float = 1e-3,
    top_frac: float = 0.02,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Compute influence and proxy scores for a logistic model."""

    _, g_test = loss_and_grad(theta, X_test, y_test, reg)
    hv = lambda v: hv_finite(theta, v, X_train, y_train, reg)
    v = cg_solve(hv, g_test, tol=1e-6, maxiter=300)

    n, _ = X_train.shape
    grads = np.zeros((n, theta.size))
    for i in range(n):
        xi = X_train[i : i + 1]
        yi = y_train[i : i + 1]
        _, gi = loss_and_grad(theta, xi, yi, reg)
        grads[i] = gi

    influence = -grads.dot(v)
    proxy = np.abs(grads.dot(g_test)) / (np.linalg.norm(grads, axis=1) + 1e-12)
    return influence, proxy, grads


def main() -> None:
    n_train, n_test, d = 300, 100, 10
    X = np.random.normal(size=(n_train + n_test, d))
    true_theta = np.random.normal(size=(d,))
    logits = X.dot(true_theta)
    probs = sigmoid(logits)
    y = (np.random.rand(len(probs)) < probs).astype(float)

    # Plant a few poisoned, high-leverage points by aligning with true_theta
    for j in range(3):
        X[j] = true_theta * 10.0
        y[j] = 1 - y[j]

    X_train, y_train = X[:n_train], y[:n_train]
    X_test, y_test = X[n_train:], y[n_train:]

    theta = np.zeros(d)
    lr = 0.5
    for epoch in range(200):
        loss, grad = loss_and_grad(theta, X_train, y_train, reg=1e-3)
        theta -= lr * grad
        if epoch % 50 == 0:
            print(f"epoch {epoch:03d} loss {loss:.4f}")

    influence, proxy, _ = influence_scores(
        theta, X_train, y_train, X_test[:20], y_test[:20], reg=1e-3, top_frac=0.02
    )

    top_infl_idx = np.argsort(-np.abs(influence))[:10]
    top_proxy_idx = np.argsort(-proxy)[:10]

    print("Top influence indices:", top_infl_idx)
    print("Influence scores:", influence[top_infl_idx])
    print("Top proxy indices:", top_proxy_idx)


if __name__ == "__main__":
    main()
