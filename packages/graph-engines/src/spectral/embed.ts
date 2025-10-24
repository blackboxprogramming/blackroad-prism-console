import { GraphData, SpectralEmbedding, SpectralOptions } from '../types';
import { buildNormalizedLaplacian } from './laplacian';
import { selectSmallestEigenpairs } from './lanczos';
import { kMeans } from './cluster';

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
}

function computeConductance(graph: GraphData, labels: number[], targetLabel: number): number {
  let cut = 0;
  let volumeInside = 0;
  let volumeOutside = 0;
  for (const edge of graph.edges) {
    const weight = edge.weight ?? 1;
    const insideSource = labels[edge.source] === targetLabel;
    const insideTarget = labels[edge.target] === targetLabel;
    if (insideSource) {
      volumeInside += weight;
    }
    if (insideTarget) {
      volumeInside += weight;
    }
    if (insideSource !== insideTarget) {
      cut += weight;
    }
  }
  const totalVolume = graph.edges.reduce((sum, edge) => sum + 2 * (edge.weight ?? 1), 0);
  volumeOutside = totalVolume - volumeInside;
  const denom = Math.min(volumeInside, volumeOutside) || 1;
  return cut / denom;
}

function computeModularity(graph: GraphData, labels: number[], degrees: number[]): number {
  const m = graph.edges.reduce((sum, edge) => sum + (edge.weight ?? 1), 0);
  const communities = new Set(labels);
  let modularity = 0;
  for (const community of communities) {
    let sumWeights = 0;
    let sumDegrees = 0;
    for (const edge of graph.edges) {
      if (labels[edge.source] === community && labels[edge.target] === community) {
        sumWeights += edge.weight ?? 1;
      }
    }
    for (let i = 0; i < labels.length; i += 1) {
      if (labels[i] === community) {
        sumDegrees += degrees[i];
      }
    }
    modularity += sumWeights / m - (sumDegrees / (2 * m)) ** 2;
  }
  return modularity;
}

export function spectralEmbedding(graph: GraphData, options: SpectralOptions): SpectralEmbedding {
  const { matrix, degrees } = buildNormalizedLaplacian(graph);
  const k = Math.min(options.k, Math.max(1, graph.nodes));
  const { values, vectors } = selectSmallestEigenpairs(matrix, k);
  const embedding = transpose(vectors);
  const clusteringSpace = embedding.map((row) => (row.length > 1 ? row.slice(1) : row));
  const { labels } = kMeans(clusteringSpace, Math.min(k, graph.nodes), options.seed);
  const eigengap: number[] = [];
  for (let i = 0; i < values.length - 1; i += 1) {
    eigengap.push(values[i + 1] - values[i]);
  }
  const conductance = Array.from({ length: Math.min(k, graph.nodes) }, (_, idx) => computeConductance(graph, labels, idx));
  const modularity = computeModularity(graph, labels, degrees);

  return {
    eigenvalues: values,
    embedding,
    clusters: labels,
    metrics: {
      eigengap,
      conductance,
      modularity
    }
  };
}
