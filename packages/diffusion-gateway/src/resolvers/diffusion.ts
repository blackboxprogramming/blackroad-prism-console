import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLScalarType, Kind } from 'graphql';
import { RectGrid, runEulerMaruyama, runFokkerPlanck, kl, mmdRbf, entropy } from '@blackroad/diffusion-engine';
import { withSpan } from '../otel.js';
import { typeDefs } from '../schema.js';
import type { RequestContext } from '../auth/rbac.js';
import { assertRole, redactIfNeeded } from '../auth/rbac.js';

interface Artifact {
  kind: string;
  name: string;
  path?: string;
}

interface InternalJob {
  id: string;
  mode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  config: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  artifacts: Artifact[];
  error?: string;
  sdeResult?: ReturnType<typeof runEulerMaruyama>;
  fpResult?: ReturnType<typeof runFokkerPlanck>;
  grid?: RectGrid;
}

const jobs = new Map<string, InternalJob>();
let counter = 0;

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON scalar',
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
      case Kind.FLOAT:
        return Number(ast.value);
      case Kind.OBJECT: {
        const value: Record<string, unknown> = {};
        for (const field of ast.fields) {
          value[field.name.value] = JSONScalar.parseLiteral(field.value, {});
        }
        return value;
      }
      case Kind.LIST:
        return ast.values.map((v) => JSONScalar.parseLiteral(v, {}));
      default:
        return null;
    }
  },
  parseValue(value) {
    return value;
  },
  serialize(value) {
    return value;
  }
});

function nowIso(): string {
  return new Date().toISOString();
}

function createJob(mode: string, config: Record<string, unknown>): InternalJob {
  const id = `diff-${Date.now()}-${counter++}`;
  const job: InternalJob = {
    id,
    mode,
    status: 'queued',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    config,
    artifacts: []
  };
  jobs.set(id, job);
  return job;
}

function updateJob(job: InternalJob, patch: Partial<InternalJob>): void {
  Object.assign(job, patch);
  job.updatedAt = nowIso();
  jobs.set(job.id, job);
}

function ensureGrid(cfg: { grid?: number[] }): RectGrid {
  const [w, h] = cfg.grid ?? [64, 64];
  return new RectGrid({ width: w, height: h, domain: 2.5 });
}

function alignSeries(a: Float32Array[], b: Float32Array[]): number {
  return Math.min(a.length, b.length);
}

function buildSchema() {
  return makeExecutableSchema({
    typeDefs,
    resolvers: {
      JSON: JSONScalar,
      Query: {
        diffJob: (_: unknown, args: { id: string }, ctx: RequestContext) => {
          const job = jobs.get(args.id);
          if (!job) return null;
          return redactIfNeeded(ctx, job);
        }
      },
      Mutation: {
        diffusionRunSDE: async (
          _: unknown,
          args: { cfg: Record<string, unknown> },
          ctx: RequestContext
        ) => {
          assertRole(ctx, 'operator');
          const job = createJob('sde', args.cfg);
          try {
            updateJob(job, { status: 'running' });
            const grid = ensureGrid(args.cfg as { grid?: number[] });
            const sdeResult = await withSpan('diff.sde.step', async () =>
              runEulerMaruyama({
                potential: (args.cfg.potential as string) ?? 'double_well',
                score: args.cfg.score as string | undefined,
                betaSchedule: (args.cfg.beta as string) ?? 'const:0.02',
                steps: Number(args.cfg.steps ?? 2000),
                dt: Number(args.cfg.dt ?? 0.01),
                particles: Number(args.cfg.particles ?? 20000),
                seed: Number(args.cfg.seed ?? 7),
                grid,
                recordEvery: Math.max(1, Math.floor(Number(args.cfg.steps ?? 2000) / 100))
              })
            );
            job.sdeResult = sdeResult;
            job.grid = grid;
            job.artifacts = sdeResult.trajectories.map((_, idx) => ({
              kind: 'frame',
              name: `frame_${idx.toString().padStart(3, '0')}.png`,
              path: `memory://${job.id}/frame_${idx}.png`
            }));
            updateJob(job, { status: 'complete' });
          } catch (error) {
            updateJob(job, { status: 'failed', error: (error as Error).message });
          }
          return redactIfNeeded(ctx, job);
        },
        diffusionRunFP: async (
          _: unknown,
          args: { cfg: Record<string, unknown> },
          ctx: RequestContext
        ) => {
          assertRole(ctx, 'operator');
          const job = createJob('fp', args.cfg);
          try {
            updateJob(job, { status: 'running' });
            const grid = ensureGrid(args.cfg as { grid?: number[] });
            const fpResult = await withSpan('diff.fp.step', async () =>
              runFokkerPlanck({
                potential: (args.cfg.potential as string) ?? 'double_well',
                betaSchedule: (args.cfg.beta as string) ?? 'const:0.02',
                steps: Number(args.cfg.steps ?? 400),
                dt: Number(args.cfg.dt ?? 0.005),
                boundary: ((args.cfg.boundary as string) ?? 'neumann') as 'neumann' | 'periodic',
                grid,
                seed: Number(args.cfg.seed ?? 7)
              })
            );
            job.fpResult = fpResult;
            job.grid = grid;
            job.metrics = {
              massDrift: fpResult.massHistory.map((m) => Math.abs(m - fpResult.massHistory[0]))
            };
            job.artifacts = fpResult.densities.map((_, idx) => ({
              kind: 'frame',
              name: `density_${idx.toString().padStart(3, '0')}.png`,
              path: `memory://${job.id}/density_${idx}.png`
            }));
            updateJob(job, { status: 'complete' });
          } catch (error) {
            updateJob(job, { status: 'failed', error: (error as Error).message });
          }
          return redactIfNeeded(ctx, job);
        },
        diffusionCompare: async (
          _: unknown,
          args: { sdeJob: string; fpJob: string },
          ctx: RequestContext
        ) => {
          assertRole(ctx, 'operator');
          const job = createJob('compare', { sdeJob: args.sdeJob, fpJob: args.fpJob });
          try {
            updateJob(job, { status: 'running' });
            const sde = jobs.get(args.sdeJob);
            const fp = jobs.get(args.fpJob);
            if (!sde?.sdeResult || !fp?.fpResult) {
              throw new Error('Both SDE and FP jobs must be completed before comparison');
            }
            const count = alignSeries(sde.sdeResult.densities, fp.fpResult.densities);
            const klSeries: number[] = [];
            const mmdSeries: number[] = [];
            const entropySde: number[] = [];
            const entropyFp: number[] = [];
            await withSpan('diff.compare.metrics', async () => {
              for (let i = 0; i < count; i++) {
                const sdeDensity = sde.sdeResult.densities[i];
                const fpDensity = fp.fpResult.densities[i];
                klSeries.push(kl(sdeDensity, fpDensity));
                mmdSeries.push(mmdRbf(sdeDensity, fpDensity));
                entropySde.push(entropy(sdeDensity));
                entropyFp.push(entropy(fpDensity));
              }
            });
            job.metrics = { kl: klSeries, mmd: mmdSeries, entropySde, entropyFp };
            updateJob(job, { status: 'complete' });
          } catch (error) {
            updateJob(job, { status: 'failed', error: (error as Error).message });
          }
          return redactIfNeeded(ctx, job);
        }
      },
      Subscription: {
        diffEvents: {
          subscribe: async function* (_: unknown, args: { jobId?: string }) {
            while (true) {
              const list = args.jobId ? [jobs.get(args.jobId)].filter(Boolean) : Array.from(jobs.values());
              for (const job of list) {
                if (job) {
                  yield { diffEvents: job };
                }
              }
              await new Promise((resolve) => setTimeout(resolve, 250));
            }
          }
        }
      }
    }
  });
}

export const schema = buildSchema();
