import { cloneEnvelope, EventEnvelope } from './envelope';

const SENSITIVE_KEYS = ['token', 'password', 'secret', 'authorization', 'cookie'];

function shouldRedact(key: string): boolean {
  return SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive));
}

function cleanseRecord(record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = cleanseRecord(value as Record<string, unknown>);
      continue;
    }

    if (shouldRedact(key)) {
      result[key] = '[redacted]';
      continue;
    }

    result[key] = value;
  }
  return result;
}

export function redactEnvelope(envelope: EventEnvelope): EventEnvelope {
  const copy = cloneEnvelope(envelope);
  copy.attrs = cleanseRecord(copy.attrs);
  copy.body = cleanseRecord(copy.body);
  return copy;
}

