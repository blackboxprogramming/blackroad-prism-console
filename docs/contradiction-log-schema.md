# Contradiction Log Schema

The contradiction log is now modelled as a small relational dataset that tracks discrete claims and the evidence collected for or against them.

## Tables

### `source`
Holds provenance for every observation so that each polarity entry can be traced back to a concrete artifact.

| column | type | notes |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY | Auto increment identifier |
| `kind` | TEXT | Describes the source family (`log`, `note`, `paper`, `agent`, …) |
| `label` | TEXT | Human readable handle |
| `uri` | TEXT | Optional URI or file path |

### `claim`
Represents the normalized proposition under discussion.

| column | type | notes |
| --- | --- | --- |
| `id` | TEXT PRIMARY KEY | Hex string (UUID-style) |
| `topic` | TEXT | Routing key, e.g. `np-vs-p` or `infra:wallets` |
| `statement` | TEXT | Normalized proposition text |
| `created_at` | TEXT | UTC timestamp |

### `claim_observation`
Records a single piece of evidence, including trinary polarity and confidence. Status drives the workflow (`open → investigating → resolved`).

| column | type | notes |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY | Observation id |
| `claim_id` | TEXT | References `claim.id` |
| `source_id` | INTEGER | References `source.id` |
| `polarity` | INTEGER | `-1` refutes, `0` needs evidence, `1` supports |
| `confidence` | REAL | 0.0 – 1.0, aggregated as weights |
| `note` | TEXT | Short rationale |
| `observed_at` | TEXT | Timestamp of the observation |
| `status` | TEXT | `open`, `investigating`, or `resolved` |

## Views

Two views simplify reporting:

- `claim_score`: Aggregates weighted support/refute/unknown values per claim and exposes observation counts.
- `claim_contradictions`: Filters `claim_score` to the claims that currently have both supporting and refuting evidence.

## Queries

```sql
-- Current contradictions ordered by strongest refute weight first
SELECT *
FROM claim_contradictions
ORDER BY refute DESC, support DESC;

-- Observations for a specific claim (replace ? with claim id)
SELECT o.id, o.polarity, o.confidence, o.status, o.note,
       s.kind, s.label, s.uri
FROM claim_observation o
JOIN source s ON s.id = o.source_id
WHERE o.claim_id = ?
ORDER BY o.observed_at DESC;

-- Escalate every claim that has strong conflicting evidence
UPDATE claim_observation
SET status = 'investigating'
WHERE claim_id IN (
  SELECT claim_id FROM claim_contradictions
  WHERE support >= 1.0 AND refute >= 1.0
) AND status = 'open';
```

## API

- `GET /api/contradictions` returns a summary (`issues`, `summary`) plus the detailed contradictory records including all recent observations.
- `POST /api/contradictions` logs an observation. Either reference an existing `claim_id` or provide `{ topic, statement }`; optional `source` metadata is normalized and deduplicated.
- `POST /api/contradictions/{id}/resolve` updates the workflow status (default `resolved`) and optionally stores a resolution note.
