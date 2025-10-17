# Codex 20 — Side-Channel Budget — Close the Acoustic/Energy Loops

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Bound information leakage through timing, power, or electromagnetic side channels.

## Core
- Estimate channel capacity using disturbance bounds: \(C \leq \tfrac{1}{2} \log\big(1 + \tfrac{P}{N}\big)\).
- Apply constant-time implementations, randomized blinding, and \(d\)-order masking to resist \(d - 1\) probes.
- Inject controlled noise, power gating, and scheduling jitter to lower signal-to-noise ratios.

## Runbook
1. Classify operations by sensitivity and enforce constant-time code paths.
2. Introduce noise and flatten power signatures with gating while adding timing jitter.
3. Validate countermeasures using correlation power analysis (CPA) score thresholds.

## Telemetry
- CPA correlation metrics against target features.
- Timing variance and electromagnetic signal-to-noise ratios.
- Success rate of side-channel penetration tests.

## Failsafes
- Disable sensitive features or require HSM execution when CPA exceeds threshold \(\tau\).
- Route workloads to hardened hardware whenever noise injections degrade functionality.

**Tagline:** Silence every leak the sensors can hear.
