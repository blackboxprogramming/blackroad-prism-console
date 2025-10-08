# Codex 16 — Supply-Chain Attestation — Build Graphs That Verify Themselves

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Ensure every artifact in the supply chain is traceable, reproducible, and cryptographically attested.

## Core
- Represent artifacts as a DAG \(G = (V, E)\) with digests \(h(v) = H(\text{content})\).
- Apply in-toto style layouts so that each step \(s\) satisfies its predicate \(\Pi_s\).
- Leverage measured boot with platform configuration registers \(p_i = H(p_{i-1} \parallel m_i)\) to bind runtime state.

## Runbook
1. Perform hermetic builds, generate SBOMs, and sign each supply-chain edge with a key scoped to \(\Pi_s\).
2. During deployment, verify the path from source \(v_0\) to target \(v_*\), confirm SBOM closure, check PCR values, and validate timestamps.
3. Deny execution if any edge is unsigned or if digests mismatch the expected lineage.

## Telemetry
- Attestation pass rate across environments.
- Number of orphan or unreferenced artifacts.
- SBOM coverage and freshness of signing keys.

## Failsafes
- Quarantine rollouts that fail attestation and initiate rollback to the last verified state.
- Require manual review for any unsigned artifact before reattempting deployment.

**Tagline:** Only the proven ship.
