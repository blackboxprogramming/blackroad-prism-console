import EventEmitter from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { GraphQLResolveInfo } from 'graphql';
import { nanoid } from 'nanoid';
import {
  barycentric,
  computeCostMatrix,
  interpolate,
  logSinkhorn,
  writeArtifacts,
  type CostMatrixOptions,
  type Diagnostics,
  type SinkhornConfig
} from '@blackroad/sb-engine';
import { assertSinkhornAccess, GatewayContext, logSafe } from '../auth/rbac.js';
import { recordIterationStats, tracer } from '../otel.js';

interface DistributionFile {
  points: number[][];
  weights: number[];
}

interface ArtifactRecord {
  name: string;
  path: string;
  contentType: string;
}

interface JobRecord {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  config: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  diagnostics?: Diagnostics;
  artifacts: ArtifactRecord[];
  error?: string;
  coupling?: Float64Array;
  rows?: number;
  cols?: number;
  sourcePoints?: number[][];
  targetPoints?: number[][];
}

const jobs = new Map<string, JobRecord>();
const events = new EventEmitter();

type ResolverContext = GatewayContext & { baseDir?: string };

async function loadDistribution(filePath: string, context: ResolverContext): Promise<DistributionFile> {
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.join(context.baseDir ?? process.cwd(), filePath);
  const raw = await fs.readFile(absolute, 'utf8');
  const payload = JSON.parse(raw) as DistributionFile;
  return payload;
}

function emitJob(job: JobRecord) {
  jobs.set(job.id, job);
  events.emit('job', job);
  events.emit(`job:${job.id}`, job);
}

function toArtifactList(paths: ArtifactRecord[]): ArtifactRecord[] {
  return paths;
}

function asIso(date: Date): string {
  return date.toISOString();
}

async function runSinkhornJob(
  job: JobRecord,
  muPath: string,
  nuPath: string,
  costMetric: string,
  eps: number,
  iters: number,
  tol: number,
  context: ResolverContext
): Promise<JobRecord> {
  const start = new Date();
  job.status = 'running';
  job.updatedAt = asIso(start);
  emitJob(job);

  try {
    const [muFile, nuFile] = await Promise.all([
      loadDistribution(muPath, context),
      loadDistribution(nuPath, context)
    ]);
    const mu = Float64Array.from(muFile.weights);
    const nu = Float64Array.from(nuFile.weights);
    const { matrix, rows, cols } = computeCostMatrix(muFile.points, nuFile.points, {
      metric: costMetric as CostMatrixOptions['metric'],
      cosineNormalize: true
    });

    const sinkhornConfig: SinkhornConfig = {
      epsilon: eps,
      maxIterations: iters,
      tolerance: tol,
      checkInterval: 5
    };

    const result = tracer.startActiveSpan('sb.sinkhorn.execute', () => logSinkhorn(mu, nu, matrix, rows, cols, sinkhornConfig));

    const bary = barycentric(result.coupling, nuFile.points, { rows, cols });
    const frames = interpolate(result.coupling, muFile.points, nuFile.points, [0, 0.25, 0.5, 0.75, 1], {
      rows,
      cols
    });

    const artifactDir = path.join(process.cwd(), 'artifacts', 'sb', job.id);
    const artifacts = await writeArtifacts({
      directory: artifactDir,
      coupling: result.coupling,
      rows,
      cols,
      barycentric: bary.map,
      diagnostics: result.diagnostics,
      frames
    });

    const metrics = {
      iterations: result.iterations,
      marginalError: result.diagnostics.marginalError,
      dualGap: result.history[result.history.length - 1]?.dualGap ?? null,
      diagnostics: result.diagnostics
    };

    recordIterationStats(result.iterations, result.diagnostics.marginalError);

    const now = new Date();
    const completed: JobRecord = {
      ...job,
      status: result.converged ? 'completed' : 'failed',
      error: result.converged ? undefined : 'Sinkhorn did not converge within the allotted iterations',
      updatedAt: asIso(now),
      metrics,
      diagnostics: result.diagnostics,
      artifacts: [
        { name: 'pi.npz', path: artifacts.piPath, contentType: 'application/octet-stream' },
        { name: 'map.png', path: artifacts.mapPath, contentType: 'image/png' },
        { name: 'diagnostics.json', path: artifacts.diagnosticsPath, contentType: 'application/json' },
        { name: 'frames.webm', path: artifacts.framesPath, contentType: 'application/json' }
      ],
      coupling: result.coupling,
      rows,
      cols,
      sourcePoints: muFile.points,
      targetPoints: nuFile.points
    };

    emitJob(completed);
    return completed;
  } catch (error) {
    const now = new Date();
    const message = error instanceof Error ? error.message : 'unknown error';
    const failed: JobRecord = {
      ...job,
      status: 'failed',
      error: message,
      updatedAt: asIso(now)
    };
    emitJob(failed);
    return failed;
  }
}

function createAsyncIterator(jobId?: string) {
  const eventName = jobId ? `job:${jobId}` : 'job';
  const queue: JobRecord[] = [];
  let resolvePending: ((value: IteratorResult<JobRecord>) => void) | null = null;

  const listener = (payload: JobRecord) => {
    if (resolvePending) {
      resolvePending({ value: payload, done: false });
      resolvePending = null;
    } else {
      queue.push(payload);
    }
  };

  events.on(eventName, listener);

  return {
    next(): Promise<IteratorResult<JobRecord>> {
      if (queue.length > 0) {
        const value = queue.shift()!;
        return Promise.resolve({ value, done: false });
      }
      return new Promise((resolve) => {
        resolvePending = resolve;
      });
    },
    return(): Promise<IteratorResult<JobRecord>> {
      events.off(eventName, listener);
      return Promise.resolve({ value: undefined, done: true });
    },
    throw(error: unknown): Promise<IteratorResult<JobRecord>> {
      events.off(eventName, listener);
      return Promise.reject(error);
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}

export const sbResolvers = {
  Query: {
    async sbJob(_parent: unknown, args: { id: string }) {
      return jobs.get(args.id) ?? null;
    }
  },
  Mutation: {
    async sbRun(
      _parent: unknown,
      args: { mu: string; nu: string; eps: number; iters?: number; tol?: number; cost?: string },
      context: ResolverContext,
      _info: GraphQLResolveInfo
    ) {
      assertSinkhornAccess(context);
      logSafe(context, 'sinkhorn:run', { cost: args.cost, eps: args.eps });
      const now = new Date();
      const job: JobRecord = {
        id: nanoid(),
        status: 'queued',
        createdAt: asIso(now),
        updatedAt: asIso(now),
        config: {
          mu: args.mu,
          nu: args.nu,
          eps: args.eps,
          iters: args.iters ?? 500,
          tol: args.tol ?? 1e-3,
          cost: args.cost ?? 'l2'
        },
        artifacts: []
      };
      emitJob(job);
      const completed = await runSinkhornJob(
        job,
        args.mu,
        args.nu,
        args.cost ?? 'l2',
        args.eps,
        args.iters ?? 500,
        args.tol ?? 1e-3,
        context
      );
      return {
        ...completed,
        artifacts: toArtifactList(completed.artifacts)
      };
    },
    async sbFrames(
      _parent: unknown,
      args: { jobId: string; t: number[] },
      context: ResolverContext
    ) {
      assertSinkhornAccess(context);
      const job = jobs.get(args.jobId);
      if (!job || job.status !== 'completed' || !job.coupling || !job.rows || !job.cols || !job.sourcePoints || !job.targetPoints) {
        throw new Error('job not ready for frame generation');
      }
      const frames = interpolate(job.coupling, job.sourcePoints, job.targetPoints, args.t, {
        rows: job.rows,
        cols: job.cols
      });
      const framesPath = path.join(process.cwd(), 'artifacts', 'sb', job.id, `frames-${Date.now()}.webm`);
      const payload = {
        format: 'sb.frames',
        version: 1,
        frames
      };
      await fs.writeFile(framesPath, JSON.stringify(payload));
      return [
        {
          name: path.basename(framesPath),
          path: framesPath,
          contentType: 'application/json'
        }
      ];
    }
  },
  Subscription: {
    sbEvents: {
      subscribe(_parent: unknown, args: { jobId?: string }) {
        return createAsyncIterator(args.jobId);
      },
      resolve(payload: JobRecord) {
        return payload;
      }
    }
  }
};
