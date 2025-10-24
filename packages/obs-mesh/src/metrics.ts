import { EventEnvelope } from './envelope';

export interface CounterMetric {
  inc(labels?: Record<string, string>): void;
}

export interface GaugeMetric {
  set(value: number, labels?: Record<string, string>): void;
}

class InMemoryCounter implements CounterMetric {
  private readonly values = new Map<string, number>();

  inc(labels: Record<string, string> = {}): void {
    const key = JSON.stringify(labels);
    const current = this.values.get(key) ?? 0;
    this.values.set(key, current + 1);
  }

  snapshot(): Map<string, number> {
    return new Map(this.values);
  }
}

class InMemoryGauge implements GaugeMetric {
  private readonly values = new Map<string, number>();

  set(value: number, labels: Record<string, string> = {}): void {
    const key = JSON.stringify(labels);
    this.values.set(key, value);
  }

  snapshot(): Map<string, number> {
    return new Map(this.values);
  }
}

export class MeshMetrics {
  readonly ingestEventsTotal = new InMemoryCounter();

  readonly ingestLagSeconds = new InMemoryGauge();

  readonly dedupeDroppedTotal = new InMemoryCounter();

  readonly redactionAppliedTotal = new InMemoryCounter();

  recordIngest(event: EventEnvelope, lagSeconds: number): void {
    this.ingestEventsTotal.inc({ source: event.source, kind: event.kind });
    this.ingestLagSeconds.set(lagSeconds, { source: event.source });
  }

  recordDedupe(event: EventEnvelope): void {
    this.dedupeDroppedTotal.inc({ source: event.source, kind: event.kind });
  }

  recordRedaction(field: string): void {
    this.redactionAppliedTotal.inc({ field });
  }
}

export function computeLagSeconds(event: EventEnvelope): number {
  const eventTs = new Date(event.ts).valueOf();
  return Math.max(0, (Date.now() - eventTs) / 1000);
}

