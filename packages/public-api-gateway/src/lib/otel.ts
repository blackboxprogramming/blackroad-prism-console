interface AuditEvent {
  actor: string;
  subject: string;
  action: string;
  metadata?: unknown;
}

type SpanEmitter = (event: string, attributes: Record<string, unknown>) => void;

let emitter: SpanEmitter | undefined;

export function configureSpanEmitter(fn: SpanEmitter) {
  emitter = fn;
}

export function emitAuditEvent(event: AuditEvent) {
  if (emitter) {
    emitter('audit.event', {
      'blackroad.actor': event.actor,
      'blackroad.subject': event.subject,
      'blackroad.action': event.action,
    });
  }
  if (process.env.NODE_ENV !== 'test') {
    console.info('AuditEvent', JSON.stringify(event));
  }
}
