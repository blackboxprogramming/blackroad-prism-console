# Codex-34 "Integrator"

Codex-34 keeps data flows gentle and reversible. This manual captures the local-first rituals that every
connector should follow.

## Consent Ritual

1. Declare the scopes you require and why. Reference the consent catalogue in `codex34.yaml`.
2. Request a TTL; never assume indefinite access.
3. Page Sentinel for scoped secrets and forget them on expiry.

## Sync Loop

1. Queue inbound records locally via `queue_io.DurableQueue`.
2. Normalize each payload with `pipelines.normalize_event.normalize` and validate against
   `contracts/event.schema.json`.
3. Measure joules per sync using `pipelines.energy_meter.estimate`.
4. Emit a receipt conforming to `contracts/receipt.schema.json`.

## Drift Etiquette

* Compare new payloads with mapper expectations via `pipelines.drift_detect.detect`.
* If drift is detected, emit a mapper update bundle for Designers and Auditors.

## Offline Recovery

* Persist pending actions locally.
* Replay in original order once connectivity resumes.

Stay courteous, stay reversible. 🧭
