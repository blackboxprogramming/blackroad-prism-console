import { createEnvelope, EventEnvelope } from '../envelope';
import { redactEnvelope } from '../redact';

export interface PromSample {
  metric: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface PromAdapterOptions {
  service?: string;
  releaseId?: string;
}

export function sampleToEnvelope(sample: PromSample, options: PromAdapterOptions = {}): EventEnvelope {
  const envelope = createEnvelope({
    ts: sample.timestamp * 1000,
    source: 'prom',
    service: options.service ?? sample.labels?.service ?? 'metrics',
    kind: 'metric',
    releaseId: options.releaseId,
    attrs: {
      metric: sample.metric,
      ...sample.labels,
    },
    body: {
      value: sample.value,
    },
  });

  return redactEnvelope(envelope);
}

