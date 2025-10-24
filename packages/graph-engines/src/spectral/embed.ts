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
import { createSeededRng } from '../determinism';
import { writeBinaryArtifact, writeTextArtifact } from '../io/artifacts';
import { GraphData, EmbeddingResult } from '../types';
import { buildNormalizedLaplacian, modularity } from './laplacian';
import { smallestKEigenpairs } from './lanczos';
import { kMeansCluster } from './cluster';

export interface SpectralOptions {
  k: number;
  seed?: number;
  artifactDir?: string;
}

export function spectralEmbedding(graph: GraphData, options: SpectralOptions): EmbeddingResult {
  const { laplacian } = buildNormalizedLaplacian(graph);
  const eigenpairs = smallestKEigenpairs(laplacian, options.k);
  const embedding = eigenpairs.map((pair) => pair.vector);
  const embeddingByNode = transpose(embedding);
  const clusters = kMeansCluster(embeddingByNode, options.k, options.seed ?? 7);
  const eigengap = eigenpairs
    .map((pair, index) => {
      if (index === eigenpairs.length - 1) return 0;
      return eigenpairs[index + 1].value - pair.value;
    })
    .map((gap) => Number(gap.toFixed(6)));
  const conductance = computeConductance(graph, clusters);
  const spectralModularity = modularity(graph, clusters);
  const metrics = {
    eigengap,
    conductance,
    modularity: Number(spectralModularity.toFixed(6))
  };

  const artifactCsv = embeddingByNode
    .map((row, node) => `${node},${row.map((value) => value.toFixed(6)).join(',')}`)
    .join('\n');
  const csvArtifact = writeTextArtifact(
    'spectral_embedding.csv',
    artifactCsv,
    'Spectral embedding coordinates',
    'csv',
    { baseDir: options.artifactDir }
  );

  const plotArtifact = writeBinaryArtifact(
    'spectral_embedding.png',
    renderSummary(embeddingByNode, clusters),
    'Deterministic summary of embedding scatter plot',
    'png',
    { baseDir: options.artifactDir }
  );

  const metricsArtifact = writeTextArtifact(
    'spectral_metrics.json',
    JSON.stringify(metrics, null, 2),
    'Spectral clustering metrics',
    'json',
    { baseDir: options.artifactDir }
  );

  return {
    eigenvalues: eigenpairs.map((pair) => pair.value),
    eigenvectors: eigenpairs.map((pair) => pair.vector),
    embedding: embeddingByNode,
    clusters,
    metrics,
    artifacts: [csvArtifact, plotArtifact, metricsArtifact]
  };
}

function transpose(matrix: number[][]): number[][] {
  if (matrix.length === 0) return [];
  return matrix[0].map((_, i) => matrix.map((row) => row[i]));
}

function computeConductance(graph: GraphData, clusters: number[]): number[] {
  const volumes = new Array(Math.max(...clusters) + 1).fill(0);
  const cuts = new Array(Math.max(...clusters) + 1).fill(0);
  const degree = new Array(graph.nodeCount).fill(0);
  for (const edge of graph.edges) {
    const w = edge.weight ?? 1;
    degree[edge.source] += w;
    degree[edge.target] += w;
    if (clusters[edge.source] !== clusters[edge.target]) {
      cuts[clusters[edge.source]] += w;
      cuts[clusters[edge.target]] += w;
    }
  }
  for (let i = 0; i < graph.nodeCount; i += 1) {
    volumes[clusters[i]] += degree[i];
  }
  return cuts.map((cut, idx) => {
    const vol = volumes[idx];
    if (vol === 0) return 0;
    const complement = degree.reduce((acc, value) => acc + value, 0) - vol;
    const denom = Math.min(vol, complement || vol);
    return Number((cut / denom).toFixed(6));
  });
}

function renderSummary(points: number[][], clusters: number[]): Buffer {
  const rng = createSeededRng(13);
  const lines: string[] = ['node,x,y,cluster'];
  points.forEach((coords, idx) => {
    const x = coords[0] + (rng() - 0.5) * 1e-6;
    const y = coords[Math.min(1, coords.length - 1)] + (rng() - 0.5) * 1e-6;
    lines.push(`${idx},${x.toFixed(6)},${y.toFixed(6)},${clusters[idx]}`);
  });
  return Buffer.from(lines.join('\n'));
}
