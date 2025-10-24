import { readFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import {
  runRicciFlow,
  metricMds,
  spectralLayout,
  bridgeToPowerLloyd,
  writeRicciArtifacts,
  type WeightedGraph,
  type RicciFlowConfig
} from '@blackroad/ricci-engine';
import { TelemetryHandle, endTelemetry } from '../../lib/telemetry';
import { assertCapability } from '../../lib/auth';
import { loadConfig } from '../../lib/config';

interface GraphRicciRunOptions {
  edgeList: string;
  curvature: 'forman' | 'ollivier';
  tau: number;
  iterations: number;
  epsilon: number;
  target?: number;
  layout: 'mds' | 'spectral' | 'powerlloyd';
  outDir: string;
  telemetry: TelemetryHandle;
}

function parseEdgeList(path: string): WeightedGraph {
  const content = readFileSync(path, 'utf8');
  const edges: { id: string; source: number; target: number; weight: number }[] = [];
  let maxNode = -1;
  const lines = content
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
    edges.push({ id: `e${index}`, source, target, weight: Math.max(1e-6, weight) });
  });
  return { nodeCount: maxNode + 1, edges };
}

function withWeights(graph: WeightedGraph, weights: Map<string, number>): WeightedGraph {
  return {
    nodeCount: graph.nodeCount,
    edges: graph.edges.map((edge) => ({ ...edge, weight: weights.get(edge.id) ?? edge.weight }))
  };
}

function computeLayout(graph: WeightedGraph, layout: 'mds' | 'spectral' | 'powerlloyd'): number[][] {
  if (layout === 'spectral') {
    return spectralLayout(graph, 2).embedding;
  }
  if (layout === 'powerlloyd') {
    const bridge = bridgeToPowerLloyd(metricMds(graph).embedding);
    return bridge.sites.map((site) => site.position as number[]);
  }
  return metricMds(graph).embedding;
}

export async function runGraphRicci(options: GraphRicciRunOptions) {
  const config = loadConfig();
  assertCapability(config, 'graph:ricci');
  try {
    const graph = parseEdgeList(resolve(process.cwd(), options.edgeList));
    const flowConfig: RicciFlowConfig = {
      curvature: options.curvature,
      tau: options.tau,
      iterations: options.iterations,
      epsilonW: options.epsilon,
      targetKappa: options.target ?? 0,
      renormalize: true
    };
    const result = await runRicciFlow(graph, flowConfig);
    const weightedGraph = withWeights(graph, result.finalWeights);
    const embedding = computeLayout(weightedGraph, options.layout);
    mkdirSync(options.outDir, { recursive: true });
    writeRicciArtifacts({
      directory: options.outDir,
      graph,
      curvature: result.finalCurvature,
      weights: result.finalWeights,
      embedding,
      stressHistory: result.steps.map((step) => ({ iteration: step.iteration, stress: step.stress }))
    });
    console.log(`[graph] ricci flow completed with stress ${result.steps[result.steps.length - 1]?.stress.toFixed(4) ?? 0}`);
  } finally {
    endTelemetry(options.telemetry);
  }
}
