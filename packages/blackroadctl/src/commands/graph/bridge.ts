import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';
import { executeGraphRequest } from '../../lib/graph-gateway';

interface GraphBridgeOptions {
  spectralJobId: string;
  layoutJobId: string;
  telemetry: TelemetryHandle;
}

export async function runGraphBridge(options: GraphBridgeOptions) {
  try {
    const density = await executeGraphRequest<{ bridgeSpectralToDensity: { id: string } }>({
      capability: 'graph:bridge',
      query: `mutation($id: ID!) {
        bridgeSpectralToDensity(jobId: $id) { id }
      }`,
      variables: { id: options.spectralJobId }
    });
    console.log(`[graph] spectral density artifact ${density.bridgeSpectralToDensity.id}`);
    const phase = await executeGraphRequest<{
      bridgeLayoutToPhase: { id: string; status: string };
    }>({
      capability: 'graph:bridge',
      query: `mutation($id: ID!) {
        bridgeLayoutToPhase(layoutJobId: $id) {
          id
          status
        }
      }`,
      variables: { id: options.layoutJobId }
    });
    console.log(`[graph] layout->phase job ${phase.bridgeLayoutToPhase.id} => ${phase.bridgeLayoutToPhase.status}`);
  } finally {
    endTelemetry(options.telemetry);
  }
}
