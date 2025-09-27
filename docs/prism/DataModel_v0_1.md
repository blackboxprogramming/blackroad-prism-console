# PRISM v0.1 — Minimal Data Model

Target warehouses: **Postgres** (prod) and **Snowflake** (analytics mirror).

## Tables

### `orgs`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `name` | Text | Display name |
| `created_at` | Timestamptz | Defaults to `now()` |

### `sources`
| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `org_id` | UUID | FK → `orgs.id` |
| `type` | Text | e.g. `source_x` |
| `status` | Text | Enum: `pending`, `connected`, `error` |
| `created_at` | Timestamptz | Defaults to `now()` |
| `updated_at` | Timestamptz | Updated on status change |

### `metrics_events`
| Column | Type | Notes |
| --- | --- | --- |
| `day` | Date | Partition day |
| `count` | Integer | Total events for that day |

### `metrics_errors`
| Column | Type | Notes |
| --- | --- | --- |
| `day` | Date | Partition day |
| `count` | Integer | Total errors for that day |

## Seeding Guidance
Use the existing generator to pre-populate:
- One org (`PRISM Demo Org`).
- One connected Source X with `status = 'connected'`.
- Seven days of event counts with trend variance.
- Seven days of error counts (smaller values, highlight spikes).

Ensure roll-ups are idempotent so nightly + manual ingest both converge on the same aggregates.
