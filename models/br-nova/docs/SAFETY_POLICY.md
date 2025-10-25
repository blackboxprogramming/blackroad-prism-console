# BR-NOVA Safety Policy

Guardian is the source of truth for data and model governance across the
BR-NOVA training stack.  The following controls are mandatory:

## Data Intake

- Every corpus must include provenance metadata and Guardian policy tags.
- PII, medical records, and private communications are strictly prohibited.
- Synthetic dialogs must be generated via deterministic templates, not external
  LLMs.
- Duplicated or near-duplicated samples above 0.85 similarity are rejected.

## Training Operations

- Training runs execute inside isolated nodes without outbound internet access.
- All checkpoints are signed and registered with Codex run cards.
- Loss and gradient logs exclude raw prompt content.
- Guardian monitors chain-of-thought leakage and halts jobs on violation.

## Inference Safeguards

- Guardian middleware enforces request rate limits and redacts unsafe prompts.
- ReflexBus publishes `inference.guardian_block` events for downstream alerting.
- Safety evaluations (refusal integrity, contradiction traps) must run before
  deployment or release to internal users.

## Incident Response

- Violations trigger automatic run card annotation and paging through Guardian.
- Remediation playbooks reside in `governance/guardian_incident.md`.
- Re-training after an incident requires sign-off from compliance and product
  leadership.
