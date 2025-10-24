import { createEnvelope, EventEnvelope, EventSeverity } from '../envelope';
import { redactEnvelope } from '../redact';

export type CaptionStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface CaptionJobEvent {
  jobId: string;
  assetId: string;
  status: CaptionStatus;
  ts: string | number | Date;
  service?: string;
  durationMs?: number;
  releaseId?: string;
  attrs?: Record<string, unknown>;
  error?: string;
}

function severityForStatus(status: CaptionStatus, error?: string): EventSeverity {
  if (status === 'FAILED' || error) {
    return 'error';
  }
  if (status === 'RUNNING') {
    return 'info';
  }
  return 'info';
}

export function captionJobToEnvelope(event: CaptionJobEvent): EventEnvelope {
  const envelope = createEnvelope({
    ts: event.ts,
    source: 'media',
    service: event.service ?? 'media-captioner',
    kind: 'job',
    severity: severityForStatus(event.status, event.error),
    releaseId: event.releaseId,
    assetId: event.assetId,
    attrs: {
      jobId: event.jobId,
      status: event.status,
      durationMs: event.durationMs,
      ...event.attrs,
    },
    body: event.error ? { error: event.error } : {},
  });

  return redactEnvelope(envelope);
}

