# Lucidia Auto-Box — Security Baseline (TTF-01)

## Threat Focus

- **Accidental data retention**: classification must remain ephemeral and respect delete/export actions.
- **Unauthorized processing**: the API rejects requests that do not include explicit consent tokens.
- **Explainability gaps**: every preview response carries rationales and minimal features for auditing.

## Controls Implemented

- Ephemeral `/classify` endpoint performs in-memory inference only; no persistence layer is wired yet.
- HTTPS/TLS enforcement is assumed by the hosting platform; Helmet hardens HTTP headers for the API stub.
- Client consent toggle gates preview submission; the API refuses processing without the provided consent token.
- Deterministic classifier keeps outputs reproducible for audit.
- Export helpers render JSON and Markdown snapshots so users can take their data with them instantly.
- Delete flow applies a 10-second hold before purging in-memory state to prevent accidental wipes.

## Next Steps

- Wire per-owner key envelopes and storage migrations.
- Extend audit logging for every preview/save/export/delete interaction.
- Introduce PQC-ready cipher toggles in configuration once storage lands.

