import { DensityField, iteratePowerLloyd } from '@blackroad/graph-engines';
import { store, nextId, JobRecord, PowerPayload } from './store';

function parseDensity(density: string): DensityField {
  const rows = density
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(/[,\s]+/).map(Number));
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const values = rows.flat();
  return { width, height, values };
}

function initialPoints(count: number, field: DensityField): { x: number; y: number; weight: number }[] {
  const points: { x: number; y: number; weight: number }[] = [];
  const stepX = field.width / count;
  const stepY = field.height / count;
  for (let i = 0; i < count; i += 1) {
    points.push({ x: (i + 0.5) * stepX, y: (i + 0.5) * stepY, weight: 0 });
  }
  return points;
}

export const powerLloydResolvers = {
  Query: {
    powerLloydJob: (_: unknown, args: { id: string }) => store.power.get(args.id) ?? null
  },
  Mutation: {
    powerLloydRun: (
      _: unknown,
      args: { density: string; n?: number; iters?: number; massTol?: number }
    ): JobRecord<PowerPayload> => {
      const field = parseDensity(args.density);
      const points = initialPoints(args.n ?? 8, field);
      const id = nextId('power');
      const job: JobRecord<PowerPayload> = {
        id,
        status: 'running',
        artifacts: []
      };
      store.power.set(id, job);
      const state = iteratePowerLloyd(points, field, {
        maxIterations: args.iters ?? 100,
        tolerance: 1e-4,
        massTolerance: args.massTol ?? 1e-3
      });
      job.status = 'completed';
      job.metrics = state.metrics;
      job.artifacts = state.artifacts;
      job.payload = { state };
      return job;
    }
  },
  PowerLloydJob: {
    density: (job: JobRecord<PowerPayload>) => job.payload?.state?.density ?? null,
    movementHistory: (job: JobRecord<PowerPayload>) => job.payload?.state?.metrics.movementHistory ?? null
  }
};
