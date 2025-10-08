# Codex 17 — Erasure-Coded Resilience — Lose Shards, Keep Truth

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Survive faults, sabotage, or regional failures without losing data integrity.

## Core
- Encode \(k\) source blocks into \(n\) coded blocks (Reed–Solomon) so any \(k\) suffice to recover the original data.
- Tolerate \(f = n - k\) faults with rate \(k / n\) tailored to the threat model.
- Use regenerating codes (MSR/MBR) to optimize repair bandwidth when restoring lost shards.

## Runbook
1. Select \((n, k)\) parameters aligned with durability and latency requirements, then geo-distribute shards.
2. Rotate shards periodically and audit decode success under simulated failure scenarios.
3. Pair storage with zero-knowledge audits proving shards belong to the same file lineage.

## Telemetry
- Decode success probability under sampled fault sets.
- Time to repair missing shards and restore redundancy.
- Entropy measurements of stored shards to detect drift or tampering.

## Failsafes
- If shard loss exceeds \(f\), trigger emergency replication and pause writes until redundancy is restored.
- Investigate anomalous entropy or audit failures before resuming regular operations.

**Tagline:** Fragment boldly, recover surely.
