import { strict as assert } from 'node:assert';

export type EventSource =
  | 'otel'
  | 'prom'
  | 'audit'
  | 'media'
  | 'economy'
  | 'gateway';

export type EventKind = 'span' | 'log' | 'metric' | 'audit' | 'job';

export type EventSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface EventEnvelope {
  ts: string;
  source: EventSource;
  service: string;
  kind: EventKind;
  severity?: EventSeverity;
  traceId?: string;
  spanId?: string;
  releaseId?: string;
  assetId?: string;
  simId?: string;
  attrs: Record<string, unknown>;
  body: Record<string, unknown>;
  schemaVersion: string;
}

export interface EnvelopeInit {
  ts: string | number | Date;
  source: EventSource;
  service: string;
  kind: EventKind;
  severity?: EventSeverity;
  traceId?: string;
  spanId?: string;
  releaseId?: string;
  assetId?: string;
  simId?: string;
  attrs?: Record<string, unknown>;
  body?: Record<string, unknown>;
  schemaVersion?: string;
}

export const EVENT_SCHEMA_VERSION = '0';

export function normalizeTimestamp(value: string | number | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    assert(!Number.isNaN(parsed.valueOf()), 'timestamp must be a valid date');
    return parsed.toISOString();
  }

  throw new TypeError('Unsupported timestamp value');
}

export function createEnvelope(init: EnvelopeInit): EventEnvelope {
  const ts = normalizeTimestamp(init.ts);
  const attrs = { ...(init.attrs ?? {}) };
  const body = { ...(init.body ?? {}) };

  const envelope: EventEnvelope = {
    ts,
    source: init.source,
    service: init.service,
    kind: init.kind,
    severity: init.severity,
    traceId: init.traceId,
    spanId: init.spanId,
    releaseId: init.releaseId,
    assetId: init.assetId,
    simId: init.simId,
    attrs,
    body,
    schemaVersion: init.schemaVersion ?? EVENT_SCHEMA_VERSION,
  };

  validateEnvelope(envelope);
  return envelope;
}

export function validateEnvelope(envelope: EventEnvelope): void {
  assert(envelope.ts, 'ts is required');
  assert(envelope.source, 'source is required');
  assert(envelope.service, 'service is required');
  assert(envelope.kind, 'kind is required');
  assert(envelope.schemaVersion === EVENT_SCHEMA_VERSION, 'schemaVersion mismatch');
  assert(!Number.isNaN(new Date(envelope.ts).valueOf()), 'ts must be ISO date');
}

export function mergeAttributes(
  envelope: EventEnvelope,
  additional: Record<string, unknown>,
): EventEnvelope {
  return {
    ...envelope,
    attrs: { ...envelope.attrs, ...additional },
  };
}

export function cloneEnvelope(envelope: EventEnvelope): EventEnvelope {
  return {
    ...envelope,
    attrs: { ...envelope.attrs },
    body: { ...envelope.body },
  };
}

export function compareEnvelope(a: EventEnvelope, b: EventEnvelope): number {
  return new Date(a.ts).valueOf() - new Date(b.ts).valueOf();
}

