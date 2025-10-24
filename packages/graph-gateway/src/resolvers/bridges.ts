import { ensureRole } from '../auth/rbac';
import { createSpan } from '../otel';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { graphEngines } from './graphEngines';

interface LayoutJobSummary {
  width: number;
  height: number;
  assignments: number[];
  clusters: number;
}

const densityArtifacts = new Map<string, { path: string; description: string }>();

export function bridgeSpectralToDensity(
  _: unknown,
  args: { jobId: string; scheme?: string },
  context: { role: string }
) {
  ensureRole(context.role, 'operator');
  const span = createSpan('bridge.spectralDensity');
  try {
    const embedding = JSON.parse(args.jobId);
    const { bridges, artifacts: loadArtifacts } = graphEngines;
    const { spectralToDensity } = bridges.spectralToDensity();
    const { writeDensityArtifact } = loadArtifacts();
    const density = spectralToDensity({ embedding, scheme: (args.scheme as 'kde' | 'uniform') ?? 'kde' });
    const jobId = randomUUID();
    const tmpDir = join(process.cwd(), '.graph-labs', jobId);
    mkdirSync(tmpDir, { recursive: true });
    const artifact = writeDensityArtifact(density, { directory: tmpDir });
    densityArtifacts.set(jobId, artifact);
    return artifact;
  } finally {
    span.end();
  }
}

export function bridgeLayoutToPhase(
  _: unknown,
  args: { layoutJobId: string; alpha?: number },
  context: { role: string }
) {
  ensureRole(context.role, 'operator');
  const span = createSpan('bridge.layoutPhase');
  try {
    const layout = JSON.parse(args.layoutJobId) as LayoutJobSummary;
    const { bridges, artifacts: loadArtifacts } = graphEngines;
    const { layoutToPhase } = bridges.layoutToPhase();
    const { writePhaseFieldArtifact } = loadArtifacts();
    const phase = layoutToPhase(layout);
    const jobId = randomUUID();
    const tmpDir = join(process.cwd(), '.graph-labs', jobId);
    mkdirSync(tmpDir, { recursive: true });
    const artifact = writePhaseFieldArtifact(phase, { directory: tmpDir });
    return {
      id: jobId,
      status: 'completed',
      metrics: { alpha: args.alpha ?? 0.5 },
      artifacts: [artifact]
    };
  } finally {
    span.end();
  }
}
