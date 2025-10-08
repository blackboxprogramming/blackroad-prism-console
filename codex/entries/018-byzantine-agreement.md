# Codex 18 — Byzantine Agreement — Keep Consensus Under Attack

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Reach agreement among distributed replicas even when some behave maliciously.

## Core
- With \(3f + 1\) replicas, tolerate up to \(f\) Byzantine faults without violating safety.
- Guarantee safety so no two honest replicas commit different values and maintain liveness under partial synchrony.
- Target commit latency of roughly two to three rounds, as in PBFT or HotStuff families.

## Runbook
1. Size quorums at \(N = 3f + 1\), randomize leaders, and rotate keys to limit targeted attacks.
2. Gossip using authenticated channels, checkpoint state, and maintain view-change proofs.
3. Rate-limit clients and detect equivocation via signed message logs.

## Telemetry
- Commit rate and consensus latency.
- Frequency of view changes and estimated fault counts.
- Network health metrics affecting synchrony assumptions.

## Failsafes
- If liveness degrades, shrink to a smaller honest core or enter read-only mode.
- Escalate to manual intervention when equivocation exceeds thresholds or key compromise is suspected.

**Tagline:** Agreement even when the room lies.
