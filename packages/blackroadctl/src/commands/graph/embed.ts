import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';
import { executeGraphRequest } from '../../lib/graph-gateway';

interface GraphEmbedOptions {
  edgeList: string;
  k: number;
  seed: number;
  telemetry: TelemetryHandle;
}

export async function runGraphEmbed(options: GraphEmbedOptions) {
  try {
    const data = await executeGraphRequest<{ spectralRun: { id: string; status: string; metrics: Record<string, unknown> } }>({
      capability: 'graph:spectral',
      query: `mutation($edgeList: String!, $k: Int!, $seed: Int!) {
        spectralRun(edgeList: $edgeList, k: $k, seed: $seed) {
          id
          status
          metrics
        }
      }`,
      variables: {
        edgeList: options.edgeList,
        k: options.k,
        seed: options.seed
      }
    });
    const job = data.spectralRun;
    console.log(`[graph] spectral job ${job.id} => ${job.status}`);
    console.log(JSON.stringify(job.metrics, null, 2));
  } finally {
    endTelemetry(options.telemetry);
  }
}
