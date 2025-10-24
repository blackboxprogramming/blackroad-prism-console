import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { spectralToDensity } from '@blackroad/graph-engines/bridges/spectral_to_density';
import { layoutToPhase } from '@blackroad/graph-engines/bridges/layout_to_phase';
import { writeDensityArtifact, writePhaseFieldArtifact } from '@blackroad/graph-engines/io/artifacts';
import { TelemetryHandle, endTelemetry } from '../../lib/telemetry';
import { assertCapability } from '../../lib/auth';
import { loadConfig } from '../../lib/config';

interface GraphBridgeOptions {
  spectralEmbedding: string;
  layoutAssignments: string;
  outDir: string;
import { endTelemetry, TelemetryHandle } from '../../lib/telemetry';
import { executeGraphRequest } from '../../lib/graph-gateway';

interface GraphBridgeOptions {
  spectralJobId: string;
  layoutJobId: string;
  telemetry: TelemetryHandle;
}

export async function runGraphBridge(options: GraphBridgeOptions) {
  const config = loadConfig();
  assertCapability(config, 'graph:bridge');
  try {
    const spectralCsv = readFileSync(resolve(process.cwd(), options.spectralEmbedding), 'utf8').trim();
    const [, ...rows] = spectralCsv.split(/\r?\n/);
    const embedding = rows.map((row) => {
      const parts = row.split(',');
      return [Number(parts[1]), Number(parts[2])];
    });
    const density = spectralToDensity({ embedding });
    writeDensityArtifact(density, { directory: options.outDir });

    const layoutJson = JSON.parse(readFileSync(resolve(process.cwd(), options.layoutAssignments), 'utf8'));
    const phase = layoutToPhase(layoutJson);
    writePhaseFieldArtifact(phase, { directory: options.outDir });
    writeFileSync(resolve(options.outDir, 'bridge.json'), JSON.stringify({ density, phase }, null, 2));
    console.log('[graph] bridge pipeline complete');
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
