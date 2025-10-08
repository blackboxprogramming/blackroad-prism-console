# Codex 21 — Conformal Risk Control — Errors You Can Budget

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Guarantee bounded error rates online without assuming a stationary data distribution.

## Core
- Define a nonconformity measure \(s(x)\) and maintain a threshold \(q_\alpha\) such that \(\Pr(s(x_{\text{new}}) \le q_\alpha) \ge 1 - \alpha\).
- Abstain or defer decisions when \(s(x) > q_\alpha\) to keep risk within budget.
- Continuously recalibrate thresholds on sliding windows to track drift.

## Runbook
1. Calibrate nonconformity scores over a recent window and maintain online quantiles.
2. Gate automated actions on conformal acceptance; route abstentions to human or slower control paths.
3. Recalibrate thresholds upon drift alarms or when error audits exceed tolerances.

## Telemetry
- Empirical error rates versus target \(\alpha\).
- Abstain rates and downstream resolution times.
- Calibration lag and drift detection statistics.

## Failsafes
- Increase abstention thresholds when observed error rises.
- Require secondary model agreement or manual oversight before resuming automatic decisions.

**Tagline:** Confidence with math-backed brakes.
