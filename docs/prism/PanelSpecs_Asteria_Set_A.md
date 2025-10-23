# Prism Panel Specs — Asteria Set A

These drop-in panels are designed to mesh with the existing Prism console while keeping math-first guarantees, operational guardrails, and "Roadie 30" field modes.

## 1. Verifiable Compute (SNARK/zkVM)
- **ID**: `panel.compute.verify`
- **Aim**: Trust results, not boxes.
- **Core relation**: Given circuit $C(x, w)$ and witness $w$, the prover emits $(y, \pi)$ such that $C(x, w) = 1$ and $y = F(x, w)$, with `Verify(π, x, y) = true`.

### Inputs
- `workload_hash`: Merkle/Keccak commitment to the compiled program.
- `public_input x`
- `vk`: verifying key
- `timeout_s`

### Controls
- `proof_system`: `Groth16 | PLONK | STARK | zkVM`
- `soundness_lambda`
- `parallel_provers` (`k`)
- `max_proof_cost`

### Run Book
1. Compile workload → R1CS/PLONKish; pin `workload_hash`.
2. Prove to obtain $(y, \pi)$.
3. Verify `π`; on success, seal `(x, y, π, vk)` to Civilizational-ECC and pin digest to the provenance DAG.

### Invariants
- Soundness: $\Pr[\text{accept} \land (x, w) \notin R] \leq \text{negl}(\lambda)$.
- Succinctness: verifier time is sublinear in runtime.

### Telemetry
- `proof_size_bytes`
- `verify_ms`
- `prover_cost_usd`
- `failure_rate_24h`
- `bits_per_joule` (`ΔMDL/J` for the run)

### Failsafes
- Prover timeout ⇒ auto-spawn redundant, diverse hardware; quarantine outputs if all fail.
- Verification failure ⇒ hard stop and provenance rollback to last green state.
- Proof cost > `max_proof_cost` ⇒ downshift to redundant execution with attestations.

### Roadie 30 Mode
- zkVM preset with small traces, offline verification on rugged laptop, proofs stored on write-once media.

---

## 2. Zero-Knowledge Access (Property-Based Auth)
- **ID**: `panel.access.zk`
- **Aim**: Grant rights by properties while revealing nothing else.
- **Math**: $\mathsf{ZKPoK}\{ w : H(w) = c \land P(w) = 1 \}$, with optional linkability via nullifier $N = H(\text{salt} \| w)$.

### Inputs
- `policy_predicate P` (Circom/Noir predicate id)
- `cred_commitment c`
- `resource_id`
- `nullifier_salt`

### Controls
- `zk_backend`: `Groth16 | PLONK | Bulletproofs`
- `max_proof_time_ms`
- `nullifier_window` (replay window)
- `linkability`: `off | per-resource | global`

### Run Book
1. Client proves $P(w)$ with commitment `c` and derives nullifier.
2. Verifier checks proof plus unseen nullifier; issues capability token scoped to `resource_id`.
3. Log capability as lattice element with expiry bound to device posture.

### Invariants
- Zero-knowledge (simulatability) and soundness $< \text{negl}(\lambda)$.
- Least privilege: token equals meet of requested capabilities and policy caps.

### Telemetry
- `proof_accept_rate`
- `median_proof_ms`
- `nullifier_collisions`
- `cap_surface_area` (granted operations count)

### Failsafes
- Predicate drift ⇒ hot-patch verifier and invalidate legacy tokens.
- Repeated failures from a principal ⇒ step-up challenge (device attestation, PQ signature).

### Roadie 30 Mode
- Local prover binaries, verifier on mesh node, QR-encoded proofs for air-gapped flows.

---

## 3. Supply-Chain Attestation (Build→Boot→Run)
- **ID**: `panel.supply.attest`
- **Aim**: Only run what’s traceable, reproducible, and signed.
- **Graphs**: Artifact DAG $G = (V, E)$ with $h(v) = H(\text{content})$; in-toto predicates $\Pi_s$; measured boot PCR chain $p_i = H(p_{i-1} \| m_i)$.

### Inputs
- `sbom_uri`
- `attest_bundle` (in-toto, SLSA level)
- `expected_pcrs`
- `timestamp_log_roots`

### Controls
- `required_slsa`: `2 | 3 | 4`
- `pcr_tolerance`: `exact | whitelist`
- `key_policy`: `hardware-bound | threshold (m-of-n)`
- `rollback_window`

### Run Book
1. Verify SBOM closure, traverse DAG to target, and check signatures scoped to $\Pi_s$.
2. Verify timestamps (Roughtime/CT logs) and measured-boot PCRs.
3. Flip traffic to the artifact only after successful checks, then anchor provenance to transparency log.

### Invariants
- No orphan nodes in $G$.
- No unsigned edges; PCRs match profile; timestamps stay within skew bounds.

### Telemetry
- `attest_pass_rate`
- `orphan_nodes`
- `pcr_mismatch_count`
- `rollback_events`

### Failsafes
- Any failed check ⇒ quarantine rollout, revert to last green, open incident with counterexample trace.
- Key compromise ⇒ rotate to threshold keys and invalidate signatures from compromised key after cutoff.

### Roadie 30 Mode
- Local SBOM and signature verification, PCR checks via TPM on field hardware, logs mirrored to write-once storage.

---

## How the Panels Interlock
- Supply-Chain Attestation gates the binaries and verifying keys used by Verifiable Compute.
- Zero-Knowledge Access issues capability tokens that trigger verifiable jobs; token identifiers feed into the SNARK public input `x` for end-to-end accountability.
- The provenance DAG records `(x, y, π, vk)` alongside the attested build path so a single hash query recovers the full history.

## Next Moves
For Wave III we can extend with Control Barrier Functions, a Differential Privacy accountant, and a Post-Quantum handshake, or deepen one of the existing panels into a full demo flow (sample inputs, expected outputs, and a red-team drill). Let me know which direction to prioritize.
