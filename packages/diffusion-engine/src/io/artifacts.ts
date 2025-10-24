import type { ArtifactRecord } from '../types.js';

export class ArtifactCollector {
  private records: ArtifactRecord[] = [];

  add(record: ArtifactRecord): void {
    this.records.push(record);
  }

  asJson(): ArtifactRecord[] {
    return this.records.map((r) => ({ ...r }));
  }
}

export function encodePngFrame(name: string, data: Buffer): ArtifactRecord {
  return { kind: 'frame', name, data };
}

export function encodeParticleState(name: string, csv: string): ArtifactRecord {
  return { kind: 'particles', name, data: csv };
}

export function encodeMetrics(name: string, metrics: Record<string, unknown>): ArtifactRecord {
  return { kind: 'metrics', name, data: metrics };
}
