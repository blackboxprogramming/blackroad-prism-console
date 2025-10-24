# RFC 0013 — Chat Surface Contract

**Status:** Accepted  
**Author:** Ops Observability Guild  
**Last Updated:** 2025-03-04

## Overview

The display + chat experience introduces a consistent schema for operator <> agent collaboration tied to jobs. This RFC documents the event contract so backends, SDKs, and external mirrors (Slack) stay interoperable.

## Event Envelope

```ts
export type ChatMessage = {
  id: string;
  jobId?: string;
  author: string;
  role: 'user' | 'agent' | 'system';
  ts: string;
  text: string;
  reactions?: Record<string, number>;
  attachments?: {
    kind: 'image' | 'json' | 'csv' | 'webm';
    url: string;
    bytes?: number;
  }[];
  redactions?: string[];
};
```

Redactions are appended notes; consumers must not mutate historic messages. Clients should render a redaction banner when the array is non-empty.

## GraphQL Schema

```graphql
subscription chatEvents($jobId: ID) {
  chatEvents(jobId: $jobId) {
    id
    jobId
    author
    role
    ts
    text
    reactions
    attachments
    redactions
  }
}
```

Mutations follow the same envelope. Operators must pass RBAC checks before being allowed to post or react.

## REST + SSE Fallback

- `GET /api/chat/thread?jobId=<id>` — hydrate a full thread.
- `POST /api/chat/post` — create message.
- `GET /events/stream?topic=chat&jobId=<id>` — server-sent events stream.

The SSE stream mirrors the GraphQL payload with `event: message` for chat events and `event: heartbeat` every 15 seconds.

## Slack Mirror

The mirror endpoint posts the author, role, text, and the first three attachments. Secrets are scrubbed via `redact()` before posting. Reactions are represented as Slack emoji reactions and periodically backfilled.

## Security

- RBAC: viewer/read, operator/write, admin/redact.
- Redactions are additive; original payload stays immutable.
- Slack mirror obeys rate limits and drops attachments above the configured threshold.

## Rollout Notes

1. Ship gateway + SDK behind a feature flag.
2. Gradually enable for OT + SB labs.
3. Mirror to Slack once confidence is achieved.
