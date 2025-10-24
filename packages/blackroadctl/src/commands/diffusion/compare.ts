import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { kl, mmdRbf, entropy } from '@blackroad/diffusion-engine';
import { endTelemetry, type TelemetryHandle } from '../../lib/telemetry';

interface StoredDensityJob {
  id: string;
  mode: 'sde' | 'fp';
  densities: number[][];
  massHistory?: number[];
}

interface RegistryEntry {
  id: string;
  mode: string;
  path: string;
}

interface CompareOptions {
  sde: string;
  fp: string;
  telemetry: TelemetryHandle;
}

const REGISTRY_PATH = resolve(process.cwd(), 'artifacts/diffusion/jobs.json');

function loadRegistry(): RegistryEntry[] {
  try {
    return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as RegistryEntry[];
  } catch {
    return [];
  }
}

export async function runDiffusionCompare(options: CompareOptions) {
  try {
    const registry = loadRegistry();
    const sdeEntry = registry.find((entry) => entry.id === options.sde);
    const fpEntry = registry.find((entry) => entry.id === options.fp);
    if (!sdeEntry || !fpEntry) {
      throw new Error('Both --sde and --fp job identifiers must exist in the registry');
    }
    const sdeData = JSON.parse(readFileSync(sdeEntry.path, 'utf8')) as StoredDensityJob;
    const fpData = JSON.parse(readFileSync(fpEntry.path, 'utf8')) as StoredDensityJob;
    const sdeDensities = sdeData.densities.map((frame) => Float32Array.from(frame));
    const fpDensities = fpData.densities.map((frame) => Float32Array.from(frame));
    const steps = Math.min(sdeDensities.length, fpDensities.length);
    if (!steps) {
      throw new Error('No overlapping frames to compare');
    }
    const metrics = {
      kl: [] as number[],
      mmd: [] as number[],
      entropySde: [] as number[],
      entropyFp: [] as number[]
    };
    for (let i = 0; i < steps; i++) {
      const a = sdeDensities[i];
      const b = fpDensities[i];
      metrics.kl.push(kl(a, b));
      metrics.mmd.push(mmdRbf(a, b));
      metrics.entropySde.push(entropy(a));
      metrics.entropyFp.push(entropy(b));
    }
    const compareId = `compare-${randomUUID()}`;
    const outDir = resolve('artifacts', 'diffusion', compareId);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
    console.log(`[diffusion] compare ${compareId}`);
    console.table(
      metrics.kl.map((value, index) => ({
        step: index,
        kl: Number(value.toFixed(4)),
        mmd: Number(metrics.mmd[index].toFixed(4)),
        entropySde: Number(metrics.entropySde[index].toFixed(4)),
        entropyFp: Number(metrics.entropyFp[index].toFixed(4))
      }))
    );
    const entry: RegistryEntry = {
      id: compareId,
      mode: 'compare',
      path: join(outDir, 'metrics.json')
    } as RegistryEntry;
    registry.push(entry);
    mkdirSync(resolve(process.cwd(), 'artifacts/diffusion'), { recursive: true });
    writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  } finally {
    endTelemetry(options.telemetry);
  }
}
