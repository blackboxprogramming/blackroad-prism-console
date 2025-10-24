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
import {
  spectralToDensity,
  layoutToPhase,
  runCahnHilliard,
  DensityField,
  PowerLloydState,
  writeTextArtifact
} from '@blackroad/graph-engines';
import { store, JobRecord, nextId, PhasePayload } from './store';

export const bridgeResolvers = {
  Mutation: {
    bridgeSpectralToDensity: (_: unknown, args: { jobId: string; scheme?: string }) => {
      const spectralJob = store.spectral.get(args.jobId);
      if (!spectralJob?.payload?.result) {
        throw new Error('Spectral job not found');
      }
      const density = spectralToDensity(spectralJob.payload.result);
      const artifact = writeTextArtifact(
        `${spectralJob.id}-density.json`,
        JSON.stringify(density),
        'Density seeded from spectral embedding',
        'json'
      );
      return artifact;
    },
    bridgeLayoutToPhase: (
      _: unknown,
      args: { layoutJobId: string; alpha?: number }
    ): JobRecord<PhasePayload> => {
      const layoutJob = store.power.get(args.layoutJobId);
      if (!layoutJob?.payload?.state) {
        throw new Error('Layout job not found');
      }
      const phaseField = layoutToPhase(
        layoutJob.payload.state.cells,
        { width: layoutJob.payload.state.density.width, height: layoutJob.payload.state.density.height },
        { alpha: args.alpha }
      );
      const id = nextId('bridge-cahn');
      const job: JobRecord<PhasePayload> = {
        id,
        status: 'running',
        artifacts: []
      };
      store.cahn.set(id, job);
      const state = runCahnHilliard(phaseField, { epsilon: 1, dt: 0.05, steps: 50 });
      job.status = 'completed';
      job.metrics = { residuals: state.residuals };
      job.artifacts = state.artifacts;
      job.payload = { state };
      return job;
    }
  }
};
