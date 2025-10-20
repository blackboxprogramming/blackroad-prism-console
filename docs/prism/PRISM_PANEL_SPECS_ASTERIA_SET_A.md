# Prism Panel Specs — Asteria Set A

This document captures the drop-in Prism panel specifications for the Asteria Set A release. Each panel is designed for hardened deployments, with explicit math, control knobs, telemetry, and Roadie 30 field notes.

## 1. Verifiable Compute (SNARK / zkVM)

**ID:** `panel.compute.verify`

**Aim:** Trust results, not boxes.

**Core Relation:**

Let the workload compile to a circuit \(C(x, w)\) with public input \(x\) and witness \(w\). The prover emits \((y, \pi)\) such that
\[
C(x, w) = 1 \quad \wedge \quad y = F(x, w), \qquad \text{Verify}(\pi, x, y) = \text{true}.
\]

### Inputs
- `workload_hash` — Merkle/Keccak digest of the program.
- `public_input` \(x\).
- `vk` — verifying key.
- `timeout_s`.

### Controls
- `proof_system`: `Groth16` \| `PLONK` \| `STARK` \| `zkVM`.
- `soundness_lambda`.
- `parallel_provers` \((k)\).
- `max_proof_cost`.

### Runbook
1. Compile workload to R1CS / PLONK-ish form; pin `workload_hash`.
2. Prove to obtain \((y, \pi)\).
3. Verify \(\pi\); on success, seal \((x, y, \pi, vk)\) to Civilizational-ECC and pin the digest to the provenance DAG.

### Invariants
- **Soundness:** \(\Pr[\text{accept} \land (x, w) \notin R] \leq \negl(\lambda)\).
- **Succinctness:** verification time \(T_{\text{verify}}\) is sublinear in runtime.

### Telemetry
- `proof_size_bytes`.
- `verify_ms`.
- `prover_cost_usd`.
- `failure_rate_24h`.
- `bits_per_joule` (\(\Delta \text{MDL}\) per joule for the run).

### Failsafes
- Prover timeout → auto-spawn redundant, diverse hardware; if all fail, quarantine outputs.
- Verify failure → hard stop plus provenance rollback to the last green state.
- Proof cost \(> \)`max_proof_cost` → downshift to redundant execution with attestations.

### Roadie 30 Field Kit
- zkVM preset with small traces.
- Offline verification on rugged laptop.
- Store proofs on write-once media.

---

## 2. Zero-Knowledge Access (Property-Based Auth)

**ID:** `panel.access.zk`

**Aim:** Grant rights by properties, reveal nothing else.

**Math:** prove knowledge of \(w\) such that \(H(w) = c\) and \(P(w) = 1\) without revealing \(w\):
\[
\mathsf{ZKPoK}\{\, w : H(w) = c \land P(w) = 1 \,\}.
\]
Optional linkability via nullifier \(N = H(\text{salt} \Vert w)\).

### Inputs
- `policy_predicate` `P` (Circom / Noir predicate identifier).
- `cred_commitment` \(c\).
- `resource_id`.
- `nullifier_salt`.

### Controls
- `zk_backend`: `Groth16` \| `PLONK` \| `Bulletproofs`.
- `max_proof_time_ms`.
- `nullifier_window` (replay window).
- `linkability`: `off` \| `per-resource` \| `global`.

### Runbook
1. Client builds proof for \(P(w)\) with commitment \(c\); derives nullifier.
2. Verifier checks proof and unseen nullifier; issues capability token scoped to `resource_id`.
3. Log capability as lattice element; bind expiry to device posture.

### Invariants
- Zero-knowledge (simulatability) and soundness \(< \negl(\lambda)\).
- Least privilege: token equals meet of requested capabilities and policy capabilities.

### Telemetry
- `proof_accept_rate`.
- `median_proof_ms`.
- `nullifier_collisions`.
- `cap_surface_area` (granted operations count).

### Failsafes
- Predicate drift (policy change) → hot-patch verifier and invalidate tokens minted under the old predicate.
- Repeated failures from a principal → step-up challenge (device attestation, PQ signature).

### Roadie 30 Field Kit
- Local prover binaries.
- Verifier runs on mesh node.
- QR-encoded proofs for air-gapped flows.

---

## 3. Supply-Chain Attestation (Build → Boot → Run)

**ID:** `panel.supply.attest`

**Aim:** Only run what is traceable, reproducible, and signed.

**Graphs:**
- Artifact DAG \(G = (V, E)\), each node hashed as \(h(v) = H(\text{content})\).
- In-toto step predicates \(\Pi_s\).
- Measured boot PCR chain: \(p_i = H(p_{i-1} \Vert m_i)\).

### Inputs
- `sbom_uri`.
- `attest_bundle` (in-toto, SLSA level).
- `expected_pcrs`.
- `timestamp_log_roots`.

### Controls
- `required_slsa`: `2` \| `3` \| `4`.
- `pcr_tolerance`: `exact` \| `whitelist`.
- `key_policy`: `hardware-bound` \| `threshold` (\(m\)-of-\(n\)).
- `rollback_window`.

### Runbook
1. Verify SBOM closure; traverse \(G\) to target artifact; check signatures scoped to \(\Pi_s\).
2. Verify timestamps (Roughtime / CT logs); verify measured-boot PCRs.
3. Flip traffic to the artifact only after successful checks; anchor provenance to transparency log.

### Invariants
- No orphan nodes in \(G\).
- No unsigned edges; PCRs match profile; timestamps within skew bounds.

### Telemetry
- `attest_pass_rate`.
- `orphan_nodes`.
- `pcr_mismatch_count`.
- `rollback_events`.

### Failsafes
- Any check failure → quarantine rollout, revert to last green, and open incident with counterexample trace.
- Key compromise → rotate to threshold keys; invalidate prior signatures from compromised key after cutoff.

### Roadie 30 Field Kit
- Local SBOM and signature verification.
- PCR check via TPM on field hardware.
- Logs mirrored to write-once storage.

---

## Interlock Strategy

- Supply-Chain Attestation gates the binaries and verifying keys used by Verifiable Compute.
- Zero-Knowledge Access issues capability tokens for verifiable jobs; the token identifier is included in the SNARK public input \(x\) for end-to-end accountability.
- The provenance DAG records \((x, y, \pi, vk)\) alongside the attested build path—query a single hash to recover the full execution story.

