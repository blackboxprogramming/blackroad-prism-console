import { createEnvelope, EventEnvelope } from '../envelope';
import { redactEnvelope } from '../redact';

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  target?: string;
  ts: string | number | Date;
  severity?: 'info' | 'warn' | 'error';
  attrs?: Record<string, unknown>;
  body?: Record<string, unknown>;
  service?: string;
  releaseId?: string;
}

export function auditToEnvelope(event: AuditEvent): EventEnvelope {
  const envelope = createEnvelope({
    ts: event.ts,
    source: 'audit',
    service: event.service ?? 'audit-log',
    kind: 'audit',
    severity: event.severity,
    traceId: event.id,
    releaseId: event.releaseId,
    attrs: {
      actor: event.actor,
      action: event.action,
      target: event.target,
      ...event.attrs,
    },
    body: event.body ?? {},
  });

  return redactEnvelope(envelope);
}

