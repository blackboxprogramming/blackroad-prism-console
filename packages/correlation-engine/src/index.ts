import { EventEnvelope } from '../../obs-mesh/src/envelope';
import { CorrelationStore } from './store/memory';
import { releaseIncidentJoin } from './joins/release_incident';
import { captionLatencyJoin } from './joins/caption_latency';
import { simulationEvidenceJoin } from './joins/sim_evidence_release';

export type CorrelationKeyType = 'traceId' | 'releaseId' | 'assetId' | 'simId';

export interface CorrelatedTimeline {
  key: string;
  keyType: CorrelationKeyType;
  timeline: EventEnvelope[];
  notes: string[];
}

export interface CorrelationRule {
  name: string;
  apply(events: EventEnvelope[], key: string, keyType: CorrelationKeyType): string[];
}

export class CorrelationEngine {
  private readonly store: CorrelationStore;

  private readonly rules: CorrelationRule[];

  constructor(store: CorrelationStore = new CorrelationStore()) {
    this.store = store;
    this.rules = [releaseIncidentJoin, captionLatencyJoin, simulationEvidenceJoin];
  }

  ingest(event: EventEnvelope): void {
    this.store.append(event);
  }

  correlate(key: string, keyType: CorrelationKeyType): CorrelatedTimeline {
    const events = this.store.findByKey(key, keyType).sort((a, b) => new Date(a.ts).valueOf() - new Date(b.ts).valueOf());
    const notes = this.rules.flatMap((rule) => rule.apply(events, key, keyType));

    return {
      key,
      keyType,
      timeline: events,
      notes,
    };
  }
}

export { CorrelationStore } from './store/memory';
export type { EventEnvelope } from '../../obs-mesh/src/envelope';

