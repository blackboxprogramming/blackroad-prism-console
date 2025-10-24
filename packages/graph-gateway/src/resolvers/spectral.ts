import { randomUUID } from 'crypto';
import type { GraphData } from '@blackroad/graph-engines/types';
import { ensureRole } from '../auth/rbac';
import { createSpan } from '../otel';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { graphEngines } from './graphEngines';

interface SpectralJobRecord {
  id: string;
  status: string;
  metrics: unknown;
  artifacts: { path: string; description: string }[];
}

const jobs = new Map<string, SpectralJobRecord>();

export function parseEdgeList(edgeList: string): GraphData {
  const edges = edgeList
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split(/\s+/);
      if (parts.length < 2) {
        throw new Error(`Invalid edge line '${line}'`);
      }
      return { source: Number(parts[0]), target: Number(parts[1]) };
    });
  const nodes = edges.reduce((max, edge) => Math.max(max, edge.source, edge.target), 0) + 1;
  return { nodes, edges };
}

export function spectralRun(_: unknown, args: { edgeList: string; k?: number; seed?: number }, context: { role: string }) {
  ensureRole(context.role, 'operator');
  const span = createSpan('spectral.run');
  const jobId = randomUUID();
  try {
    const graph = parseEdgeList(args.edgeList);
    const { spectral: loadSpectral, artifacts: loadArtifacts } = graphEngines;
    const { spectralEmbedding } = loadSpectral();
    const { writeSpectralArtifacts } = loadArtifacts();
    const result = spectralEmbedding(graph, {
      k: args.k ?? 8,
      seed: args.seed ?? 7
    });
    const tmpDir = join(process.cwd(), '.graph-labs', jobId);
    mkdirSync(tmpDir, { recursive: true });
    const artifacts = writeSpectralArtifacts(result, { directory: tmpDir });
    const metrics = {
      eigengap: result.metrics.eigengap,
      modularity: result.metrics.modularity
    };
    const job: SpectralJobRecord = { id: jobId, status: 'completed', metrics, artifacts };
    jobs.set(jobId, job);
    return job;
  } finally {
    span.end();
  }
}

export function spectralJob(_: unknown, args: { id: string }, context: { role: string }) {
  ensureRole(context.role, 'viewer');
  return jobs.get(args.id) ?? null;
}
import { spectralEmbedding, GraphData } from '@blackroad/graph-engines';
import { store, nextId, JobRecord, SpectralPayload } from './store';

function parseEdgeList(edgeList: string): GraphData {
  const edges = edgeList
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[,\s]+/).map(Number))
    .filter((parts) => parts.length >= 2)
    .map((parts) => ({ source: parts[0], target: parts[1], weight: parts[2] ?? 1 }));
  const nodeCount = edges.reduce((acc, edge) => Math.max(acc, edge.source, edge.target), 0) + 1;
  return { nodeCount, edges };
}

export const spectralResolvers = {
  Query: {
    spectralJob: (_: unknown, args: { id: string }) => store.spectral.get(args.id) ?? null
  },
  Mutation: {
    spectralRun: (
      _: unknown,
      args: { edgeList: string; k?: number; seed?: number }
    ): JobRecord<SpectralPayload> => {
      const graph = parseEdgeList(args.edgeList);
      const id = nextId('spectral');
      const job: JobRecord<SpectralPayload> = {
        id,
        status: 'running',
        artifacts: [],
        payload: { graph }
      };
      store.spectral.set(id, job);
      const result = spectralEmbedding(graph, { k: args.k ?? 8, seed: args.seed });
      job.status = 'completed';
      job.metrics = result.metrics;
      job.artifacts = result.artifacts;
      job.payload = { graph, result };
      return job;
    }
  },
  SpectralJob: {
    embedding: (job: JobRecord<SpectralPayload>) => job.payload?.result?.embedding ?? null,
    clusters: (job: JobRecord<SpectralPayload>) => job.payload?.result?.clusters ?? null
  }
};
