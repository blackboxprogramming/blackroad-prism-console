import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { join, resolve } from 'path';
import {
  RectGrid,
  runEulerMaruyama,
  runFokkerPlanck,
  type SDEConfig as EngineSdeConfig,
  type FPConfig as EngineFpConfig
} from '@blackroad/diffusion-engine';
import { endTelemetry, type TelemetryHandle } from '../../lib/telemetry';

interface RegistryEntry {
  id: string;
  mode: 'sde' | 'fp' | 'compare';
  createdAt: string;
  config: Record<string, unknown>;
  path: string;
}

interface DiffusionRunOptions {
  mode: 'sde' | 'fp' | 'compare';
  potential?: string;
  score?: string;
  beta?: string;
  steps: number;
  dt: number;
  particles?: number;
  grid?: number;
  boundary?: 'neumann' | 'periodic';
  seed: number;
  outDir?: string;
  telemetry: TelemetryHandle;
}

const REGISTRY_PATH = resolve(process.cwd(), 'artifacts/diffusion/jobs.json');

function loadRegistry(): RegistryEntry[] {
  try {
    const data = readFileSync(REGISTRY_PATH, 'utf8');
    return JSON.parse(data) as RegistryEntry[];
  } catch {
    return [];
  }
}

function saveRegistry(entries: RegistryEntry[]) {
  mkdirSync(resolve(process.cwd(), 'artifacts/diffusion'), { recursive: true });
  writeFileSync(REGISTRY_PATH, JSON.stringify(entries, null, 2));
}

export async function runDiffusionRun(options: DiffusionRunOptions) {
  const jobId = `diff-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const targetDir = resolve(options.outDir ?? join('artifacts', 'diffusion', jobId));
  mkdirSync(targetDir, { recursive: true });
  try {
    if (options.mode === 'sde') {
      const grid = new RectGrid({ width: options.grid ?? 64, height: options.grid ?? 64, domain: 2.5 });
      const cfg: EngineSdeConfig = {
        potential: options.potential ?? 'double_well',
        score: options.score,
        betaSchedule: options.beta ?? 'const:0.02',
        steps: options.steps,
        dt: options.dt,
        particles: options.particles ?? 10000,
        seed: options.seed,
        grid,
        recordEvery: Math.max(1, Math.floor(options.steps / 50))
      };
      const result = runEulerMaruyama(cfg);
      const payload = {
        id: jobId,
        mode: options.mode,
        createdAt,
        config: cfg,
        grid: { width: grid.width, height: grid.height, domain: grid.domain },
        trajectories: result.trajectories.map((frame) => Array.from(frame)),
        densities: result.densities.map((density) => Array.from(density))
      };
      writeFileSync(join(targetDir, 'result.json'), JSON.stringify(payload));
      console.log(`[diffusion] SDE run ${jobId} produced ${payload.trajectories.length} frames`);
    } else {
      const grid = new RectGrid({ width: options.grid ?? 64, height: options.grid ?? 64, domain: 2.5 });
      const cfg: EngineFpConfig = {
        potential: options.potential ?? 'double_well',
        betaSchedule: options.beta ?? 'const:0.02',
        steps: options.steps,
        dt: options.dt,
        grid,
        boundary: options.boundary ?? 'neumann',
        seed: options.seed
      };
      const result = runFokkerPlanck(cfg);
      const payload = {
        id: jobId,
        mode: options.mode,
        createdAt,
        config: cfg,
        grid: { width: grid.width, height: grid.height, domain: grid.domain },
        densities: result.densities.map((density) => Array.from(density)),
        massHistory: result.massHistory
      };
      writeFileSync(join(targetDir, 'result.json'), JSON.stringify(payload));
      console.log(`[diffusion] FP run ${jobId} produced ${payload.densities.length} frames`);
    }
    const registry = loadRegistry();
    registry.push({
      id: jobId,
      mode: options.mode,
      createdAt,
      config: {
        potential: options.potential,
        beta: options.beta,
        steps: options.steps,
        dt: options.dt,
        particles: options.particles,
        grid: options.grid,
        boundary: options.boundary,
        seed: options.seed
      },
      path: join(targetDir, 'result.json')
    });
    saveRegistry(registry);
  } finally {
    endTelemetry(options.telemetry);
  }
}
