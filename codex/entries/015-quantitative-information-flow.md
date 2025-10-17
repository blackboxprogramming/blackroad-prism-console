# Codex 15 — Quantitative Information Flow — Measure the Leak

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Keep secrets secure by quantifying leakage instead of relying on intuition.

## Core
- Define information leakage through a channel \(C\) as mutual information \(\mathcal{L} = I(S; O) = H(S) - H(S \mid O)\).
- Enforce quantitative noninterference so that \(\mathcal{L} \leq \epsilon\) for each release.
- Use hyperproperty reasoning (2-safety) to compare pairs of runs against policy constraints.

## Runbook
1. Annotate confidential sources and observable sinks; instrument systems to estimate \(I(S; O)\).
2. Allocate an \(\epsilon\) leakage budget per module and deny releases that exceed the cap.
3. Apply differential privacy, padding, or channel randomization to reduce \(\mathcal{L}\).

## Telemetry
- Bits leaked per query or release and cumulative leakage versus budget.
- Effectiveness of mitigation techniques over time.
- Alerts raised when leakage approaches thresholds.

## Failsafes
- Trigger an emergency kill switch when leakage exceeds the budget.
- Capture forensic snapshots and patch the offending module before re-enabling output.

**Tagline:** Quantify every whisper.
