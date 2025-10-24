import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter, on } from 'events';
import {
  runRicciFlow,
  metricMds,
  spectralLayout,
  bridgeToPowerLloyd,
  writeRicciArtifacts,
  computeFormanCurvature,
  computeOllivierCurvature,
  ricciStep as performRicciStep,
  type WeightedGraph,
  type RicciFlowConfig,
  type RicciFlowStep
} from '@blackroad/ricci-engine';
import { ensureRole } from '../auth/rbac';
import { createSpan } from '../otel';

interface RicciJobRecord {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  config: RicciFlowConfig;
  metrics: Record<string, unknown>;
  artifacts: { path: string; description: string }[];
  error?: string;
  state: {
    graph: WeightedGraph;
    weights: Map<string, number>;
    steps: RicciFlowStep[];
    embedding: number[][];
  };
}

const jobs = new Map<string, RicciJobRecord>();
const emitter = new EventEmitter();

function parseEdgeList(edgeList: string): WeightedGraph {
  const edges: { id: string; source: number; target: number; weight: number }[] = [];
  let maxNode = -1;
  const lines = edgeList
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  lines.forEach((line, index) => {
    const parts = line.split(/[\s,]+/);
    if (parts.length < 2) {
      throw new Error(`invalid edge list line: ${line}`);
    }
    const source = Number(parts[0]);
    const target = Number(parts[1]);
    const weight = parts.length > 2 ? Number(parts[2]) : 1;
    if (!Number.isFinite(source) || !Number.isFinite(target)) {
      throw new Error(`invalid edge: ${line}`);
    }
    maxNode = Math.max(maxNode, source, target);
    edges.push({ id: `e${index}`, source, target, weight: Math.max(weight, 1e-6) });
  });
  return { nodeCount: maxNode + 1, edges };
}

function graphWithWeights(graph: WeightedGraph, weights: Map<string, number>): WeightedGraph {
  return {
    nodeCount: graph.nodeCount,
    edges: graph.edges.map((edge) => ({ ...edge, weight: weights.get(edge.id) ?? edge.weight }))
  };
}

function recordMetrics(step: RicciFlowStep) {
  return {
    averageKappa: step.curvature.metrics.averageKappa,
    negativeRatio: step.curvature.metrics.negativeRatio,
    sinkhornIterations: step.curvature.metrics.sinkhornIterations ?? 0,
    stress: step.stress
  };
}

function emitUpdate(job: RicciJobRecord) {
  emitter.emit('update', job);
}

async function computeLayout(graph: WeightedGraph, method: string, embedding?: number[][]) {
  if (method === 'spectral') {
    return spectralLayout(graph, 2).embedding;
  }
  if (method === 'powerlloyd') {
    const initial = embedding ?? metricMds(graph).embedding;
    const bridge = bridgeToPowerLloyd(initial);
    return bridge.sites.map((site) => site.position as number[]);
  }
  return metricMds(graph).embedding;
}

export async function ricciRun(
  _: unknown,
  args: { edgeList: string; cfg: RicciFlowConfig & { layout?: string } },
  context: { role: string }
) {
  ensureRole(context.role, 'operator');
  const span = createSpan('ricci.run');
  const jobId = randomUUID();
  try {
    const graph = parseEdgeList(args.edgeList);
    const config: RicciFlowConfig = {
      curvature: args.cfg.curvature,
      tau: args.cfg.tau ?? 0.05,
      iterations: args.cfg.iterations ?? 50,
      epsilonW: args.cfg.epsilonW ?? 1e-6,
      targetKappa: args.cfg.targetKappa ?? 0,
      sinkhorn: args.cfg.sinkhorn,
      renormalize: true,
      minTau: args.cfg.minTau ?? args.cfg.tau ?? 0.05
    };
    const result = await runRicciFlow(graph, config);
    const embedding = await computeLayout(graphWithWeights(graph, result.finalWeights), args.cfg.layout ?? 'mds');
    const artifactsDir = join(process.cwd(), '.graph-labs', jobId);
    mkdirSync(artifactsDir, { recursive: true });
    const artifacts = writeRicciArtifacts({
      directory: artifactsDir,
      graph,
      curvature: result.finalCurvature,
      weights: result.finalWeights,
      embedding,
      stressHistory: result.steps.map((step) => ({ iteration: step.iteration, stress: step.stress }))
    });
    const job: RicciJobRecord = {
      id: jobId,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config,
      metrics: recordMetrics(result.steps[result.steps.length - 1]),
      artifacts,
      state: {
        graph,
        weights: new Map(result.finalWeights),
        steps: result.steps,
        embedding
      }
    };
    jobs.set(jobId, job);
    emitUpdate(job);
    return job;
  } catch (error) {
    const failed: RicciJobRecord = {
      id: jobId,
      status: 'failed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: args.cfg,
      metrics: {},
      artifacts: [],
      error: (error as Error).message,
      state: {
        graph: { nodeCount: 0, edges: [] },
        weights: new Map(),
        steps: [],
        embedding: []
      }
    };
    jobs.set(jobId, failed);
    emitUpdate(failed);
    throw error;
  } finally {
    span.end();
  }
}

export async function ricciLayout(
  _: unknown,
  args: { jobId: string; layout?: string },
  context: { role: string }
) {
  ensureRole(context.role, 'operator');
  const job = jobs.get(args.jobId);
  if (!job) {
    throw new Error(`ricci job ${args.jobId} not found`);
  }
  const span = createSpan('ricci.layout');
  try {
    const method = args.layout ?? 'mds';
    const embedding = await computeLayout(graphWithWeights(job.state.graph, job.state.weights), method, job.state.embedding);
    job.state.embedding = embedding;
    job.updatedAt = new Date().toISOString();
    job.metrics = { ...job.metrics, layout: method };
    emitUpdate(job);
    return job;
  } finally {
    span.end();
  }
}

export async function ricciStep(
  _: unknown,
  args: { jobId: string; tau?: number },
  context: { role: string }
) {
  ensureRole(context.role, 'operator');
  const job = jobs.get(args.jobId);
  if (!job) {
    throw new Error(`ricci job ${args.jobId} not found`);
  }
  const span = createSpan('ricci.step');
  try {
    const config = { ...job.config, tau: args.tau ?? job.config.tau };
    const graph = graphWithWeights(job.state.graph, job.state.weights);
    const curvature =
      config.curvature === 'ollivier'
        ? await computeOllivierCurvature(graph, {
            sinkhornEps: config.sinkhorn?.sinkhornEps ?? 0.01,
            sinkhornIters: config.sinkhorn?.sinkhornIters ?? 200,
            tolerance: config.sinkhorn?.tolerance ?? 1e-3
          })
        : computeFormanCurvature(graph);
    const previousStress = job.state.steps.length > 0 ? job.state.steps[job.state.steps.length - 1].stress : undefined;
    const step = performRicciStep(graph, job.state.weights, curvature, config, job.state.steps.length, previousStress);
    job.state.weights = new Map(step.weights);
    job.state.steps.push(step);
    job.metrics = recordMetrics(step);
    job.updatedAt = new Date().toISOString();
    emitUpdate(job);
    return job;
  } finally {
    span.end();
  }
}

export function ricciJob(_: unknown, args: { id: string }, context: { role: string }) {
  ensureRole(context.role, 'viewer');
  return jobs.get(args.id) ?? null;
}

export function ricciEvents() {
  return {
    async *[Symbol.asyncIterator]() {
      for await (const event of on(emitter, 'update')) {
        yield event;
      }
    }
  };
}
