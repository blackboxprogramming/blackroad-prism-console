import { EventEnvelope } from '../../../obs-mesh/src/envelope';
import { CorrelationKeyType, CorrelationRule } from '../index';

export const simulationEvidenceJoin: CorrelationRule = {
  name: 'sim_evidence_release',
  apply(events: EventEnvelope[], key: string, keyType: CorrelationKeyType): string[] {
    if (keyType !== 'simId' && keyType !== 'releaseId') {
      return [];
    }

    const relevant = events.filter((event) => event.simId === key || event.releaseId === key);
    if (relevant.length === 0) {
      return [];
    }

    const evidence = relevant
      .map((event) => event.attrs?.['evidenceHash'])
      .filter((value): value is string => typeof value === 'string');

    if (evidence.length === 0) {
      return [];
    }

    return [`Evidence hashes linked: ${Array.from(new Set(evidence)).join(', ')}`];
  },
};

