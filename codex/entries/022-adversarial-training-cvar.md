# Codex 22 — Adversarial Training with CVaR — Robust by the Tail

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Optimize models for worst-case performance by focusing on tail risk instead of average loss.

## Core
- Minimize conditional value at risk (CVaR) at level \(\alpha\): \(\min_\theta \ \text{CVaR}_\alpha(\ell(f_\theta(x + \delta), y))\) subject to \(\|\delta\| \le \epsilon\).
- Generate hard examples through projected gradient descent (PGD) or expectation over transformation (EOT) loops.
- Use randomized smoothing or Lipschitz bounds to certify robustness where feasible.

## Runbook
1. In the inner loop, create adversarial perturbations, tracking tail losses throughout training.
2. In the outer loop, optimize parameters to minimize CVaR while enforcing a floor on clean accuracy.
3. Certify robustness post-training and log certified radii alongside accuracy metrics.

## Telemetry
- Tail loss trajectories and CVaR estimates.
- Gap between clean and robust accuracy.
- Certified radii coverage across validation sets.

## Failsafes
- When tail loss exceeds budget, reduce exposure, increase regularization, or pause deployment.
- Require human review before shipping models whose robustness certificates regress.

**Tagline:** Train for the attacks you dread, not the averages you like.
