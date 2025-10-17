# Codex 25 — Network Coding for Recovery — Throughput with Armor

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Maximize goodput and accelerate recovery in the face of packet loss or jamming.

## Core
- Apply random linear network coding so transmitted packets \(y_i = \sum_j a_{ij} x_j\) carry innovative combinations.
- Decode once the receiver collects packets whose coefficients span the unknowns (full rank).
- Adapt redundancy rates to observed signal-to-noise ratio (SNR) and adversarial conditions.

## Runbook
1. Encode data at network edges, tuning redundancy for current loss conditions.
2. Prioritize critical flows by allocating higher coding rates and monitor rank growth at receivers.
3. Combine coding with path diversity to mitigate targeted interference.

## Telemetry
- Rank progression over time for each flow.
- Goodput versus offered load and retransmission rates.
- Loss, jam, or interference indicators across paths.

## Failsafes
- Increase redundancy or reroute traffic when rank stagnates or decoding stalls.
- Escalate to alternate transports when multiple paths experience correlated failure.

**Tagline:** Mix packets so recovery outruns loss.
