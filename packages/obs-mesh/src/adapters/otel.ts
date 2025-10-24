import { createEnvelope, EventEnvelope, EventSeverity } from '../envelope';
import { redactEnvelope } from '../redact';

export interface OtelResource {
  attributes?: Record<string, unknown>;
}

export interface OtelSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTimeUnixNano: number;
  endTimeUnixNano?: number;
  attributes?: Record<string, unknown>;
  resource?: OtelResource;
  status?: {
    code?: number;
    message?: string;
  };
}

export interface OtelLogRecord {
  timeUnixNano: number;
  severityNumber?: number;
  severityText?: string;
  body?: unknown;
  attributes?: Record<string, unknown>;
  resource?: OtelResource;
  traceId?: string;
  spanId?: string;
}

export interface AdapterOptions {
  service?: string;
  releaseId?: string;
}

function resolveService(spanOrLog: { resource?: OtelResource }, fallback?: string): string {
  const serviceName = spanOrLog.resource?.attributes?.['service.name'];
  if (typeof serviceName === 'string' && serviceName.length > 0) {
    return serviceName;
  }
  if (fallback) {
    return fallback;
  }
  return 'unknown-service';
}

function severityFromStatus(code?: number, fallback?: string): EventSeverity | undefined {
  if (typeof code === 'number') {
    if (code >= 2) {
      return 'error';
    }
    if (code === 1) {
      return 'warn';
    }
    return 'info';
  }
  if (fallback) {
    const normalized = fallback.toLowerCase();
    if (normalized.includes('error')) return 'error';
    if (normalized.includes('warn')) return 'warn';
  }
  return undefined;
}

export function spanToEnvelope(span: OtelSpan, options: AdapterOptions = {}): EventEnvelope {
  const envelope = createEnvelope({
    ts: span.startTimeUnixNano / 1_000_000,
    source: 'otel',
    service: resolveService(span, options.service),
    kind: 'span',
    severity: severityFromStatus(span.status?.code),
    traceId: span.traceId,
    spanId: span.spanId,
    releaseId: options.releaseId,
    attrs: {
      name: span.name,
      parentSpanId: span.parentSpanId,
      durationMs:
        span.endTimeUnixNano && span.endTimeUnixNano > span.startTimeUnixNano
          ? (span.endTimeUnixNano - span.startTimeUnixNano) / 1_000_000
          : undefined,
      ...span.attributes,
      ...span.resource?.attributes,
    },
    body: span.status?.message ? { statusMessage: span.status?.message } : {},
  });

  return redactEnvelope(envelope);
}

export function logRecordToEnvelope(
  log: OtelLogRecord,
  options: AdapterOptions = {},
): EventEnvelope {
  const envelope = createEnvelope({
    ts: log.timeUnixNano / 1_000_000,
    source: 'otel',
    service: resolveService(log, options.service),
    kind: 'log',
    severity: severityFromStatus(log.severityNumber, log.severityText),
    traceId: log.traceId,
    spanId: log.spanId,
    releaseId: options.releaseId,
    attrs: {
      severityText: log.severityText,
      ...log.attributes,
      ...log.resource?.attributes,
    },
    body: typeof log.body === 'object' && log.body !== null ? (log.body as Record<string, unknown>) : { value: log.body },
  });

  return redactEnvelope(envelope);
}

