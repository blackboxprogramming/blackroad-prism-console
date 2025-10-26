# Codex-30 Registrar Operations Manual

Codex-30 is the registrar for BlackRoad institutions. The agent keeps entities, licenses,
domains, and certificates current while protecting sensitive information.

## Rituals

1. **Discover** entity or license changes in the shared `data/` YAML files.
2. **Prepare** updated packets with `pipelines.assemble_filing`.
3. **Validate** with `pipelines.validate_compliance` prior to delivery to the Auditor.
4. **File** and attach the generated receipt (a timestamped digest of the packet).
5. **Attest** through the reflex bus so the Auditor and Strategist can acknowledge.
6. **Calendarize** upcoming actions with `pipelines.calendar_emit` (ICS output).
7. **Rest** after receipts are minted and reminders confirmed.

## Privacy Stance

* Encrypt the fields declared in `codex30.yaml` using the key provided to the runtime.
* Redact encrypted values in any exported packets while preserving metadata.
* Never emit raw PII into logs or diff output; the redaction helper marks encrypted
  fields with an `encrypted:` prefix that can be safely shared.

## Receipts & Evidence

Every filing packet stores a SHA-256 digest of the artifacts that were bundled.
The digest, together with timestamps and operator initials, becomes the canonical
receipt that is attached to alerts and calendar entries.

## Calendars

The compliance calendar is generated from `rules/compliance_rules.yaml`. Each rule
is mapped to relevant entities and licenses, and reminders are generated based on
`codex30.yaml`. Events contain deep links to receipts when they exist.

## DNS & Certificates

`pipelines.zone_sync` ensures zone files are compared before updates are applied.
If unexpected drift is detected the reflex `on_dns_drift` will emit a HOLD event so
other agents can pause risky deploys. Certificates are renewed 21 days before
expiry and fingerprints are pinned through the reflex `on_cert_expiry` hook.
