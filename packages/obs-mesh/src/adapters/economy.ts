import { createEnvelope, EventEnvelope } from '../envelope';
import { redactEnvelope } from '../redact';

export interface SimulationEvent {
  simId: string;
  ts: string | number | Date;
  stage: 'STARTED' | 'FINISHED' | 'FAILED';
  evidenceHash?: string;
  releaseId?: string;
  service?: string;
  attrs?: Record<string, unknown>;
  error?: string;
}

export function simulationToEnvelope(event: SimulationEvent): EventEnvelope {
  const envelope = createEnvelope({
    ts: event.ts,
    source: 'economy',
    service: event.service ?? 'economy-sim',
    kind: 'job',
    severity: event.stage === 'FAILED' ? 'error' : 'info',
    simId: event.simId,
    releaseId: event.releaseId,
    attrs: {
      stage: event.stage,
      evidenceHash: event.evidenceHash,
      ...event.attrs,
    },
    body: event.error ? { error: event.error } : {},
  });

  return redactEnvelope(envelope);
}

