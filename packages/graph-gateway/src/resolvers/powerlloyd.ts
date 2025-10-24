import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { join } from 'path';
import type { DensityField, PowerLloydSite } from '@blackroad/graph-engines/types';
import { ensureRole } from '../auth/rbac';
import { createSpan } from '../otel';
import { graphEngines } from './graphEngines';

interface PowerLloydJobRecord {
  id: string;
  status: string;
  metrics: unknown;
  artifacts: { path: string; description: string }[];
}

const jobs = new Map<string, PowerLloydJobRecord>();

function parseDensity(json: string): DensityField {
  const parsed = JSON.parse(json);
  if (typeof parsed.width !== 'number' || typeof parsed.height !== 'number') {
    throw new Error('density missing width/height');
  }
  if (!Array.isArray(parsed.values) || parsed.values.length !== parsed.width * parsed.height) {
    throw new Error('density values mismatch');
  }
  return { width: parsed.width, height: parsed.height, values: parsed.values.map((value: number) => Number(value)) };
}

function initializeSites(count: number): PowerLloydSite[] {
  const sites: PowerLloydSite[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (2 * Math.PI * i) / count;
    sites.push({ position: [0.5 + 0.3 * Math.cos(angle), 0.5 + 0.3 * Math.sin(angle)], weight: 0, targetMass: 1 / count });
  }
  return sites;
}

export function powerLloydRun(
  _: unknown,
  args: { density: string; n?: number; iters?: number; massTol?: number; seed?: number },
  context: { role: string }
) {
  ensureRole(context.role, 'operator');
  const span = createSpan('powerlloyd.run');
  const jobId = randomUUID();
  try {
    const density = parseDensity(args.density);
    const sites = initializeSites(Math.min(args.n ?? 16, 64));
    const { powerLloyd: loadPowerLloyd, artifacts: loadArtifacts } = graphEngines;
    const { runPowerLloyd } = loadPowerLloyd();
    const { writeDensityArtifact } = loadArtifacts();
    const result = runPowerLloyd(density, sites, {
      iterations: args.iters ?? 50,
      massTolerance: args.massTol ?? 0.05,
      movementTolerance: 1e-3,
      seed: args.seed ?? 7
    });
    const tmpDir = join(process.cwd(), '.graph-labs', jobId);
    mkdirSync(tmpDir, { recursive: true });
    const artifact = writeDensityArtifact(density, { directory: tmpDir });
    const job: PowerLloydJobRecord = {
      id: jobId,
      status: 'completed',
      metrics: {
        lastMovement: result.history[result.history.length - 1] ?? 0,
        lastMassError: result.massErrors[result.massErrors.length - 1] ?? 0
      },
      artifacts: [artifact]
    };
    jobs.set(jobId, job);
    return job;
  } finally {
    span.end();
  }
}

export function powerLloydJob(_: unknown, args: { id: string }, context: { role: string }) {
  ensureRole(context.role, 'viewer');
  return jobs.get(args.id) ?? null;
}
