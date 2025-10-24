import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { join } from 'path';
import type { PhaseField } from '@blackroad/graph-engines/types';
import { ensureRole } from '../auth/rbac';
import { createSpan } from '../otel';
import { graphEngines } from './graphEngines';

interface CahnJobRecord {
  id: string;
  status: string;
  metrics: unknown;
  artifacts: { path: string; description: string }[];
}

const jobs = new Map<string, CahnJobRecord>();

function parseField(json: string): PhaseField {
  const parsed = JSON.parse(json);
  if (typeof parsed.width !== 'number' || typeof parsed.height !== 'number') {
    throw new Error('field missing width/height');
  }
  if (!Array.isArray(parsed.values) || parsed.values.length !== parsed.width * parsed.height) {
    throw new Error('field values mismatch');
  }
  return { width: parsed.width, height: parsed.height, values: parsed.values.map((value: number) => Number(value)) };
}

export function cahnRun(
  _: unknown,
  args: { initField: string; eps?: number; dt?: number; steps?: number },
  context: { role: string }
) {
  ensureRole(context.role, 'operator');
  const span = createSpan('cahn.run');
  const jobId = randomUUID();
  try {
    const field = parseField(args.initField);
    const { cahn: loadCahn, artifacts: loadArtifacts } = graphEngines;
    const { runCahnHilliard } = loadCahn();
    const { writePhaseFieldArtifact } = loadArtifacts();
    const result = runCahnHilliard({ field }, {
      epsilon: args.eps ?? 1.2,
      dt: args.dt ?? 0.1,
      steps: args.steps ?? 100,
      recordEvery: 10
    });
    const tmpDir = join(process.cwd(), '.graph-labs', jobId);
    mkdirSync(tmpDir, { recursive: true });
    const artifacts = result.frames.map((frame, index) =>
      writePhaseFieldArtifact(frame, { directory: join(tmpDir, `frame_${index}`) })
    );
    const metrics = {
      residual: result.residuals[result.residuals.length - 1] ?? 0,
      mass: result.mass
    };
    const job: CahnJobRecord = { id: jobId, status: 'completed', metrics, artifacts };
    jobs.set(jobId, job);
    return job;
  } finally {
    span.end();
  }
}

export function cahnJob(_: unknown, args: { id: string }, context: { role: string }) {
  ensureRole(context.role, 'viewer');
  return jobs.get(args.id) ?? null;
}
