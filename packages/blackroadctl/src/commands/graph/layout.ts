import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';
import { executeGraphRequest } from '../../lib/graph-gateway';

interface GraphLayoutOptions {
  density: string;
  n: number;
  iters: number;
  massTol: number;
  telemetry: TelemetryHandle;
}

export async function runGraphLayout(options: GraphLayoutOptions) {
  try {
    const data = await executeGraphRequest<{
      powerLloydRun: { id: string; status: string; metrics: Record<string, unknown> };
    }>({
      capability: 'graph:layout',
      query: `mutation($density: String!, $n: Int!, $iters: Int!, $massTol: Float!) {
        powerLloydRun(density: $density, n: $n, iters: $iters, massTol: $massTol) {
          id
          status
          metrics
        }
      }`,
      variables: {
        density: options.density,
        n: options.n,
        iters: options.iters,
        massTol: options.massTol
      }
    });
    const job = data.powerLloydRun;
    console.log(`[graph] power-lloyd job ${job.id} => ${job.status}`);
    console.log(JSON.stringify(job.metrics, null, 2));
  } finally {
    endTelemetry(options.telemetry);
  }
}
