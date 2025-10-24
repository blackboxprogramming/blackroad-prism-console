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
