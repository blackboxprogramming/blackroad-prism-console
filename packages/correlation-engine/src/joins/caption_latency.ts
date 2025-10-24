import { EventEnvelope } from '../../../obs-mesh/src/envelope';
import { CorrelationKeyType, CorrelationRule } from '../index';

function durationFromEvent(event: EventEnvelope): number | undefined {
  const value = event.attrs?.['durationMs'];
  return typeof value === 'number' ? value : undefined;
}

export const captionLatencyJoin: CorrelationRule = {
  name: 'caption_latency',
  apply(events: EventEnvelope[], key: string, keyType: CorrelationKeyType): string[] {
    if (keyType !== 'assetId') {
      return [];
    }

    const jobEvents = events.filter((event) => event.source === 'media' && event.assetId === key);
    if (jobEvents.length === 0) {
      return [];
    }

    const durations = jobEvents
      .map((event) => durationFromEvent(event))
      .filter((value): value is number => typeof value === 'number');

    if (durations.length === 0) {
      return [];
    }

    const avg = durations.reduce((acc, value) => acc + value, 0) / durations.length;
    const max = Math.max(...durations);

    const notes = [`Caption latency avg ${avg.toFixed(0)}ms (pMax ${max.toFixed(0)}ms).`];

    const regression = jobEvents.some((event) => event.releaseId) && max >= avg * 1.2;
    if (regression) {
      const release = jobEvents.find((event) => event.releaseId)?.releaseId ?? 'unknown-release';
      notes.push(`Latency regression observed near release ${release}.`);
    }

    return notes;
  },
};

