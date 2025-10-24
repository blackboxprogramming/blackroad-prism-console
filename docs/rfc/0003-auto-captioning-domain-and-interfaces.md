# RFC 0003 — Auto-Captioning Domain and Interfaces

## Summary

This RFC captures the minimum viable product for the RoadStudio captioning pipeline. It focuses on deterministic, testable processing that can be backed by either a local speech-to-text stub or an external provider adapter. The goal is to provide a clear contract for orchestration, storage, and client integrations so that the team can iterate safely towards production quality.

## Goals

- Deterministic segmentation, alignment, and formatting for repeatable outputs.
- Pluggable transcription adapters with redacted logging and observability spans.
- Caption job lifecycle that survives restarts and provides idempotent retries.
- Clear interfaces for the control-plane SDK, CLI, and RoadStudio UI.

## Non-Goals

- Speaker diarisation or translation.
- Frame-accurate subtitle burn-in.
- Durable queue or object storage integrations.

## Domain Entities

### CaptionJob

| Field | Description |
| --- | --- |
| `id` | Stable identifier for the job. |
| `assetId` | RoadStudio asset that owns the captions. |
| `backend` | Transcription adapter (`local` or `provider`). |
| `status` | `QUEUED`, `RUNNING`, `COMPLETE`, `FAILED`. |
| `artifacts` | Collection of generated caption files (SRT, VTT, JSON). |
| `error` | Populated when the job fails. |

### AudioSegment

Represents a deterministic slice of the input audio after ingestion. Segments are generated via a seeded algorithm so that repeated runs produce identical segment IDs.

### TranscriptChunk

Aligned group of words with timings and confidences. A caption formatter consumes ordered chunks to produce artefacts.

## Lifecycle

1. **Ingest** — Resolve local file paths or download remote URLs into a scratch directory.
2. **Segment** — Produce deterministic `AudioSegment[]` using fixed duration windows.
3. **Transcribe** — Use the adapter selected by the job (`local` or `provider`).
4. **Align & Punctuate** — Map chunks back to segments and normalise punctuation for readability.
5. **Format** — Emit SRT, VTT, and JSON outputs with golden snapshot coverage.
6. **Store & Attach** — Persist artefacts to a store (file-system for dev) and attach to the RoadStudio asset.
7. **Notify** — Publish job state transitions via GraphQL subscription and CLI output.

## Failure Modes

- **Provider timeout** — Retry with exponential backoff and surface a redacted error message.
- **Empty audio** — Short-circuit with a validation error before invoking adapters.
- **Partial transcripts** — Continue processing available segments and mark missing ones with warnings.

## Observability

Each pipeline stage emits an OpenTelemetry span with `jobId`, `assetId`, and `backend` attributes. Metrics track job counts, durations, and error rates. Secrets are redacted before logging.

## Testing Strategy

- Unit tests for segmentation, alignment, and formatting (including golden snapshots).
- Contract test for GraphQL schema.
- CLI smoke test driving a local backend (future work once the worker loop is wired to the pipeline).

## Rollout

The captioning stack ships behind a feature flag. Week one delivers the engine and GraphQL schema. Week two introduces the provider adapter, CLI wiring, and UI panel. Week three focuses on observability polish and documentation.
