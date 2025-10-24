import { createGrid, runCahnHilliard, DensityField } from '@blackroad/graph-engines';
import { store, nextId, JobRecord, PhasePayload } from './store';

function parseField(text: string): DensityField {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(/[,\s]+/).map(Number));
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const values = rows.flat();
  return { width, height, values };
}

export const cahnResolvers = {
  Query: {
    cahnJob: (_: unknown, args: { id: string }) => store.cahn.get(args.id) ?? null
  },
  Mutation: {
    cahnRun: (
      _: unknown,
      args: { initField: string; eps?: number; dt?: number; steps?: number }
    ): JobRecord<PhasePayload> => {
      const initial = parseField(args.initField);
      const id = nextId('cahn');
      const job: JobRecord<PhasePayload> = {
        id,
        status: 'running',
        artifacts: []
      };
      store.cahn.set(id, job);
      const grid = createGrid({
        width: initial.width,
        height: initial.height,
        initial: (x, y) => initial.values[y * initial.width + x],
        seed: 7
      });
      const state = runCahnHilliard(grid, {
        epsilon: args.eps ?? 1.2,
        dt: args.dt ?? 0.1,
        steps: args.steps ?? 100
      });
      job.status = 'completed';
      job.artifacts = state.artifacts;
      job.metrics = { residuals: state.residuals };
      job.payload = { state };
      return job;
    }
  },
  CahnJob: {
    frames: (job: JobRecord<PhasePayload>) => job.payload?.state?.frames ?? null,
    residuals: (job: JobRecord<PhasePayload>) => job.payload?.state?.residuals ?? null
  }
};
