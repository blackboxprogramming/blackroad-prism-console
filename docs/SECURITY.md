# Lucidia Auto-Box Security Notes (TTF-01)

These notes capture the initial security posture for the Auto-Box prototype. They will expand into a full threat model during the next codex drop.

## Guiding Controls
- **Encryption**: Require TLS 1.3 for transport. Data at rest is encrypted with per-owner data keys wrapped by a configurable key-encryption key (KEK). Algorithms are configurable to enable PQC-ready swaps.
- **Least privilege**: Services operate with the minimum scopes necessary. No background processing runs without an explicit consent receipt.
- **Auditability**: Every action touching user data must emit an owner-visible audit log entry.
- **Purge semantics**: A single deletion action wipes items, assignments, boxes, and their associated encryption material.

## Immediate Tasks
1. Harden `/classify` to reject unconsented requests and throttle abusive clients.
2. Implement consent receipts before persisting any data.
3. Extend audit logging beyond the in-memory prototype to persistent, user-visible history.
4. Finalize key management with client-held keys where browser capabilities allow.
