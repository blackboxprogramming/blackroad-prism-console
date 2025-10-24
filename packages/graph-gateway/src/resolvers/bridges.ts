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
