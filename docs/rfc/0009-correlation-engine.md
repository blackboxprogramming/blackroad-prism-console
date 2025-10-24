# RFC 0009 — Correlation Engine MVP

## Overview

The correlation engine sits downstream of the observability mesh to aggregate envelopes into timelines, derived
insights, and governance breadcrumbs. Version `0` focuses on deterministic joins that unblock the Ops Timeline UI,
incident retros, and release review workflows.

## Key Concepts

- **Correlation Key** — `traceId`, `releaseId`, `assetId`, or `simId` depending on the investigation.
- **Timeline** — ordered envelopes retrieved from the event store for a given correlation key.
- **Rule** — functional unit that inspects a timeline and appends human-readable notes.

## Rules Implemented

1. **Release ↔ Incident** — Connects `deploy.create` audit events with incident route logs. Highlights when a release
   intersects incident traffic and when incidents are absent following a deploy.
2. **Caption Latency** — Aggregates caption job durations per asset, surfacing mean/max latency and flagging regressions
   when latency spikes 50% above average near a release.
3. **Simulation Evidence ↔ Release** — Detects evidence hashes emitted by governance simulations and lists unique hashes
   associated with the release or simulation ID.

## Store Strategy

- In-memory store for hot timelines (used by the gateway and CLI).
- JSON file store for cold retention and offline analysis.
- Append-only writes; reading by key filters relevant envelopes at query time.

## API Surface

- `correlate(key, keyType)` → returns `{ key, keyType, timeline, notes }`.
- Timeline ordering is stable (ascending `ts`).
- Notes list is deterministic for a given input set.

## Future Work

- Persist timelines to durable storage (PostgreSQL/ClickHouse).
- Support windowed queries (e.g., `since`, `until`).
- Expand rule library (error budget burn, simulation regression diffs, control-plane release scorecards).
- Expose rule provenance metadata for audit trails.

