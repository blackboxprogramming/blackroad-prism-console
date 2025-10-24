import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { densityFromEmbedding } from '@blackroad/graph-engines/powerlloyd/density';
import { runPowerLloyd } from '@blackroad/graph-engines/powerlloyd/iterate';
import { DensityField, PowerLloydSite } from '@blackroad/graph-engines/types';
import { writeDensityArtifact } from '@blackroad/graph-engines/io/artifacts';
import { TelemetryHandle, endTelemetry } from '../../lib/telemetry';
import { assertCapability } from '../../lib/auth';
import { loadConfig } from '../../lib/config';

interface GraphLayoutOptions {
  seed: number;
  outDir: string;
  initSites?: number;
  embeddingPath: string;
  telemetry: TelemetryHandle;
}

function parseEmbedding(path: string): number[][] {
  const csv = readFileSync(path, 'utf8').trim();
  const [, ...rows] = csv.split(/\r?\n/);
  return rows.map((row) => {
    const parts = row.split(',');
    return [Number(parts[1]), Number(parts[2])];
  });
}

function initializeSites(count: number): PowerLloydSite[] {
  const sites: PowerLloydSite[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (2 * Math.PI * i) / count;
    sites.push({ position: [0.5 + 0.25 * Math.cos(angle), 0.5 + 0.25 * Math.sin(angle)], weight: 0, targetMass: 1 / count });
  }
  return sites;
}

export async function runGraphLayout(options: GraphLayoutOptions) {
  const config = loadConfig();
  assertCapability(config, 'graph:layout');
  try {
    const embeddingPoints = parseEmbedding(resolve(process.cwd(), options.embeddingPath));
    const density: DensityField = densityFromEmbedding(embeddingPoints);
    const sites = initializeSites(options.initSites ?? 12);
    const result = runPowerLloyd(density, sites, {
      iterations: 50,
      massTolerance: 0.05,
      movementTolerance: 1e-3,
      seed: options.seed
    });
    mkdirSync(options.outDir, { recursive: true });
    writeDensityArtifact(density, { directory: options.outDir });
    writeFileSync(resolve(options.outDir, 'layout.json'), JSON.stringify(result, null, 2));
    console.log(`[graph] layout converged in ${result.history.length} steps`);
  } finally {
    endTelemetry(options.telemetry);
  }
}
