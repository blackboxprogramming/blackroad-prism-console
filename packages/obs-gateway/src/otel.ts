import { MeshMetrics, EventEnvelope } from './mesh';

export class GatewayTelemetry {
  constructor(private readonly metrics: MeshMetrics) {}

  recordIngest(event: EventEnvelope): void {
    const lagSeconds = Math.max(0, (Date.now() - new Date(event.ts).valueOf()) / 1000);
    this.metrics.recordIngest(event, lagSeconds);
  }
}

