import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import { buildDynamicInterpolation, rasterizePowerDiagram, solveWeights } from '@blackroad/ot-engine';
import { withSpan } from '../otel';
import { assertRole, Principal } from '../auth/rbac';

type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

type OTJob = {
  id: string;
  kind: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  config: Record<string, unknown>;
  cost?: number;
  diagnostics?: Record<string, unknown>;
  artifacts: Artifact[];
};

type Artifact = {
  id: string;
  kind: string;
  uri: string;
};

type JobResultPayload = {
  frames?: { width: number; height: number; data: Float64Array }[];
  flows?: unknown;
  ownerAscii?: string;
};

const jobs = new Map<string, OTJob>();
const payloads = new Map<string, JobResultPayload>();
const emitter = new EventEmitter();

function nowIso() {
  return new Date().toISOString();
}

function publish(job: OTJob) {
  emitter.emit('job', job);
}

async function executeJob(
  job: OTJob,
  run: () => Promise<{ cost?: number; diagnostics?: Record<string, unknown>; artifacts?: Artifact[]; payload?: JobResultPayload }>
) {
  job.status = 'RUNNING';
  job.updatedAt = nowIso();
  publish(job);
  try {
    const result = await run();
    job.status = 'SUCCEEDED';
    job.cost = result.cost;
    job.diagnostics = result.diagnostics;
    job.artifacts = result.artifacts ?? [];
    job.updatedAt = nowIso();
    publish(job);
    if (result.payload) {
      payloads.set(job.id, result.payload);
    }
  } catch (err) {
    job.status = 'FAILED';
    job.updatedAt = nowIso();
    job.diagnostics = { error: err instanceof Error ? err.message : String(err) };
    publish(job);
    throw err;
  }
}

function createJob(kind: string, config: Record<string, unknown>): OTJob {
  const job: OTJob = {
    id: nanoid(),
    kind,
    status: 'PENDING',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    config,
    artifacts: [],
  };
  jobs.set(job.id, job);
  publish(job);
  return job;
}

function densityFromConfig(config: any) {
  if (!config || typeof config !== 'object') {
    throw new Error('density config missing');
  }
  const { width, height, data } = config;
  if (typeof width !== 'number' || typeof height !== 'number' || !Array.isArray(data)) {
    throw new Error('density config must include width, height, data');
  }
  return { width, height, data: Float64Array.from(data), cellArea: config.cellArea ?? 1 };
}

function asciiOwner(owner: Uint32Array, width: number, height: number): string {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      row += owner[y * width + x].toString(16);
    }
    rows.push(row);
  }
  return rows.join('\n');
}

function encodeArtifact(kind: string, payload: unknown): Artifact {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
  return {
    id: nanoid(),
    kind,
    uri: `data:application/json;base64,${data}`,
  };
}

async function* jobIterator(filter: (job: OTJob) => boolean) {
  while (true) {
    const job = await new Promise<OTJob>((resolve) => {
      const listener = (payload: OTJob) => {
        if (!filter(payload)) {
          return;
        }
        emitter.off('job', listener);
        resolve(payload);
      };
      emitter.on('job', listener);
    });
    yield job;
  }
}

export const resolvers = {
  Query: {
    otJob: (_: unknown, args: { id: string }) => jobs.get(args.id) ?? null,
  },
  Mutation: {
    otSemiDiscreteSolve: async (
      _: unknown,
      args: { config: any },
      context: { principal?: Principal }
    ): Promise<OTJob> => {
      assertRole(context.principal, 'ot:run');
      const job = createJob('semidiscrete', args.config ?? {});
      await executeJob(job, async () => {
        const { sites, masses, density: densityConfig } = args.config || {};
        if (!Array.isArray(sites) || !Array.isArray(masses)) {
          throw new Error('config must include sites and masses');
        }
        const density = densityFromConfig(densityConfig);
        const targetMasses = masses.map((m: any) => Number(m));
        const weightsResult = await withSpan(
          { name: 'ot.semidiscrete.weight_solve', attributes: { sites: sites.length } },
          async () =>
            solveWeights({
              density,
              sites: sites.map((s: any) => ({ x: Number(s.x), y: Number(s.y) })),
              targetMasses,
              options: { tolerance: 0.01 },
            })
        );
        const owner = rasterizePowerDiagram(
          sites.map((s: any) => ({ x: Number(s.x), y: Number(s.y) })),
          Array.from(weightsResult.weights),
          density,
          { includeMass: false }
        ).owner;
        const ascii = asciiOwner(owner, density.width, density.height);
        const diagnostics = {
          masses: Array.from(weightsResult.masses),
          iterations: weightsResult.iterations,
          converged: weightsResult.converged,
        };
        return {
          cost: 0,
          diagnostics,
          artifacts: [encodeArtifact('laguerre-ascii', { ascii })],
          payload: { ownerAscii: ascii },
        };
      });
      return job;
    },
    otDynamicSolve: async (
      _: unknown,
      args: { config: any },
      context: { principal?: Principal }
    ): Promise<OTJob> => {
      assertRole(context.principal, 'ot:run');
      const job = createJob('dynamic', args.config ?? {});
      await executeJob(job, async () => {
        const { rho0, rho1, steps = 8 } = args.config || {};
        const density0 = densityFromConfig(rho0);
        const density1 = densityFromConfig(rho1);
        const dynamicResult = await withSpan(
          { name: 'ot.dynamic.solve', attributes: { steps } },
          async () => buildDynamicInterpolation({ rho0: density0, rho1: density1, steps })
        );
        const diagnostics = {
          continuityResidual: dynamicResult.continuityResidual,
          steps,
        };
        return {
          cost: dynamicResult.totalCost,
          diagnostics,
          artifacts: [
            encodeArtifact('dynamic-summary', {
              totalCost: dynamicResult.totalCost,
              continuityResidual: dynamicResult.continuityResidual,
            }),
          ],
          payload: { frames: dynamicResult.frames },
        };
      });
      return job;
    },
    otInterpolate: (
      _: unknown,
      args: { jobId: string; t: number },
      context: { principal?: Principal }
    ): Artifact => {
      assertRole(context.principal, 'ot:run');
      const job = jobs.get(args.jobId);
      if (!job) {
        throw new Error('job not found');
      }
      const payload = payloads.get(job.id);
      if (!payload || !payload.frames) {
        throw new Error('job does not contain frames');
      }
      const frames = payload.frames;
      const clamped = Math.max(0, Math.min(1, args.t));
      const index = Math.round(clamped * (frames.length - 1));
      const frame = frames[index];
      return encodeArtifact('ot-frame', {
        index,
        width: frame.width,
        height: frame.height,
        data: Array.from(frame.data),
      });
    },
  },
  Subscription: {
    otEvents: {
      subscribe: (_: unknown, args: { jobId?: string }) => {
        const filter = (job: OTJob) => !args.jobId || job.id === args.jobId;
        return jobIterator(filter);
      },
      resolve: (value: OTJob) => value,
    },
  },
};
