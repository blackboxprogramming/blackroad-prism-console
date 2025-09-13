# Event Contracts

This catalog defines canonical event envelopes and schemas for the platform.

## Envelope

Every event uses a common envelope with the following required fields:

- `source` – origin family of the event
- `type` – specific event type (kebab or dot-case)
- `id` – unique idempotency key
- `ts` – ISO8601 timestamp of occurrence
- `actor` – user or system that triggered the event
- `payload` – event-specific data
- `headers` – additional metadata

## Versioning

Event types are named using kebab-case or dot-case (e.g. `github.push`).
Breaking changes append a suffix such as `:v2` to the type name. Older
versions remain available during a deprecation window before removal.

## Source Families

- `salesforce.*`
- `github.*`
- `infra.*`
- `sre.*`
- `billing.*`
- `data.*`
- `auth.*`
- `support.*`

Each schema in this directory captures the minimal structure for the
corresponding event type.
