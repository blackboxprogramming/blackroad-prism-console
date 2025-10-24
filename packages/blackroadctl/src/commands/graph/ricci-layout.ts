import { readFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import {
  metricMds,
  spectralLayout,
  bridgeToPowerLloyd,
  writeRicciArtifacts,
  type WeightedGraph
} from '@blackroad/ricci-engine';
import { TelemetryHandle, endTelemetry } from '../../lib/telemetry';
import { assertCapability } from '../../lib/auth';
import { loadConfig } from '../../lib/config';

interface GraphRicciLayoutOptions {
  edgeList: string;
  weights: string;
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
    maxNode = Math.max(maxNode, source, target);
    edges.push({ id: `e${index}`, source, target, weight: 1 });
  });
  return { nodeCount: maxNode + 1, edges };
}

function parseWeights(path: string): Map<string, number> {
  const csv = readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const weights = new Map<string, number>();
  for (let i = 1; i < csv.length; i += 1) {
    const parts = csv[i].split(',');
    if (parts.length < 4) {
      continue;
    }
    weights.set(parts[0], Number(parts[3]));
  }
  return weights;
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

export async function runGraphRicciLayout(options: GraphRicciLayoutOptions) {
  const config = loadConfig();
  assertCapability(config, 'graph:ricci');
  try {
    const graph = parseEdgeList(resolve(process.cwd(), options.edgeList));
    const weights = parseWeights(resolve(process.cwd(), options.weights));
    const weightedGraph = withWeights(graph, weights);
    const embedding = computeLayout(weightedGraph, options.layout);
    mkdirSync(options.outDir, { recursive: true });
    writeRicciArtifacts({
      directory: options.outDir,
      graph,
      curvature: { values: new Map(), metrics: { averageKappa: 0, negativeRatio: 0 } },
      weights,
      embedding,
      stressHistory: []
    });
    console.log(`[graph] ricci layout (${options.layout}) exported to ${options.outDir}`);
  } finally {
    endTelemetry(options.telemetry);
  }
}
