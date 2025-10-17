# Codex 19 — Rate-Limit Calculus — Bound Blast Radius

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Prove that no single client or tenant can overwhelm the system.

## Core
- Enforce token bucket policies with parameters \((r, b)\): admit requests only when available tokens exceed the cost.
- Bound worst-case load over window \(T\) by \(rT + b\).
- Compose hierarchical rate limits by enforcing the minimum allowance across multiple buckets.

## Runbook
1. Assign per-principal \((r, b)\) values based on risk class and business priority.
2. Enforce limits locally and at edge layers while composing with upstream throttles.
3. Measure effective demand and adjust parameters cautiously with safe step sizes.

## Telemetry
- Accepted versus dropped requests by principal.
- Bucket occupancy distributions and refill latency.
- Impact on tail latency and error budgets.

## Failsafes
- Clamp burst size \(b\) to a minimum when anomalies spike.
- Shift excess load to queues or lotteries to preserve fairness under sustained attack.

**Tagline:** Throttle proof before throttle panic.
