# Codex 27 — Provenance DAG — Who Touched What, Provably

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Maintain an immutable history of data and model lineage with cryptographic integrity.

## Core
- Model each transformation as a node \(v\) in a DAG with incoming edges from its inputs.
- Hash node contents so any tampering breaks path verification.
- Sign lineage updates and anchor digests to transparency logs for public verification.

## Runbook
1. Hash inputs, code, and environment metadata; sign and append new nodes to the provenance graph.
2. Support impact analysis via graph reachability and automate recalls of contaminated outputs.
3. Periodically anchor the DAG root hashes to append-only transparency or blockchain logs.

## Telemetry
- Latency of path verification queries.
- Count of orphan nodes or unverifiable edges.
- Time to recall or quarantine affected outputs.

## Failsafes
- Block publication of artifacts with unverifiable provenance paths.
- Quarantine entire subtrees when signatures or hashes mismatch expectations.

**Tagline:** Every lineage, logged and locked.
