import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { endTelemetry, type TelemetryHandle } from '../../lib/telemetry';

interface ExportOptions {
  job: string;
  output: string;
  telemetry: TelemetryHandle;
}

interface RegistryEntry {
  id: string;
  path: string;
}

const REGISTRY_PATH = resolve(process.cwd(), 'artifacts/diffusion/jobs.json');

function loadRegistry(): RegistryEntry[] {
  try {
    return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as RegistryEntry[];
  } catch {
    return [];
  }
}

export async function runDiffusionExport(options: ExportOptions) {
  try {
    const registry = loadRegistry();
    const job = registry.find((entry) => entry.id === options.job);
    if (!job) {
      throw new Error(`Job ${options.job} not found in registry`);
    }
    const payload = JSON.parse(readFileSync(job.path, 'utf8')) as { densities?: number[][]; trajectories?: number[][] };
    const frames = payload.densities ?? payload.trajectories;
    if (!frames || !frames.length) {
      throw new Error('Job does not contain any frames to export');
    }
    const normalized = frames.map((values, index) => ({ index, values }));
    writeFileSync(resolve(options.output), JSON.stringify(normalized));
    console.log(`[diffusion] exported ${frames.length} frames to ${options.output}`);
  } finally {
    endTelemetry(options.telemetry);
  }
}
