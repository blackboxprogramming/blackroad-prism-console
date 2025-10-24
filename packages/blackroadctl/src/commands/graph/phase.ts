import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';
import { executeGraphRequest } from '../../lib/graph-gateway';

interface GraphPhaseOptions {
  field: string;
  eps: number;
  dt: number;
  steps: number;
  telemetry: TelemetryHandle;
}

export async function runGraphPhase(options: GraphPhaseOptions) {
  try {
    const data = await executeGraphRequest<{
      cahnRun: { id: string; status: string; metrics: Record<string, unknown> };
    }>({
      capability: 'graph:phase',
      query: `mutation($field: String!, $eps: Float!, $dt: Float!, $steps: Int!) {
        cahnRun(initField: $field, eps: $eps, dt: $dt, steps: $steps) {
          id
          status
          metrics
        }
      }`,
      variables: {
        field: options.field,
        eps: options.eps,
        dt: options.dt,
        steps: options.steps
      }
    });
    const job = data.cahnRun;
    console.log(`[graph] cahn-hilliard job ${job.id} => ${job.status}`);
    console.log(JSON.stringify(job.metrics, null, 2));
  } finally {
    endTelemetry(options.telemetry);
  }
}
