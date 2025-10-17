# Codex 14 — Zero-Knowledge Access — Reveal Nothing, Prove Enough

**Fingerprint:** `23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2`

## Aim
Grant access rights based on properties while withholding identity and sensitive attributes.

## Core
- Use zero-knowledge proofs of knowledge to show membership in policy predicates without revealing the witness: \(\text{ZKPoK}\{w : H(w) = c \wedge P(w) = 1\}\).
- Apply group or ring signatures to provide signer anonymity with optional linkability.
- Log nullifiers or other one-time tokens to prevent reuse without deanonymizing.

## Runbook
1. Define the policy predicate \(P\) and issue credentials that commit to \(c\).
2. At access time, present a zero-knowledge proof that \(P(w)\) holds while revealing no personally identifiable information.
3. Record a nullifier or serial number to detect double-spend or abuse attempts.

## Telemetry
- Proof acceptance rate and average generation time.
- Distribution of nullifier usage and collision monitoring.
- Credential issuance and revocation volume.

## Failsafes
- If the policy predicate drifts or becomes stale, hot-patch it and force credential refresh.
- Escalate to step-up authentication (such as device attestation) after repeated proof failures or suspected abuse.

**Tagline:** Permissions by proof, not by passport.
