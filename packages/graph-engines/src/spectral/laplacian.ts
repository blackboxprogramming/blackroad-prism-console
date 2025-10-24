import { GraphData } from '../types';

export interface LaplacianResult {
  laplacian: number[][];
  degrees: number[];
}

export function buildNormalizedLaplacian(graph: GraphData): LaplacianResult {
  const n = graph.nodeCount;
  const adjacency: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (const edge of graph.edges) {
    const weight = edge.weight ?? 1;
    adjacency[edge.source][edge.target] += weight;
    adjacency[edge.target][edge.source] += weight;
  }
  const degrees = adjacency.map((row) => row.reduce((acc, value) => acc + value, 0));
  const laplacian: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (i === j) {
        laplacian[i][j] = 1;
      }
      if (adjacency[i][j] === 0) continue;
      const di = degrees[i];
      const dj = degrees[j];
      if (di === 0 || dj === 0) continue;
      const normalized = adjacency[i][j] / Math.sqrt(di * dj);
      laplacian[i][j] -= normalized;
    }
  }
  return { laplacian, degrees };
}

export function modularity(graph: GraphData, clusters: number[]): number {
  const m = graph.edges.reduce((acc, edge) => acc + (edge.weight ?? 1), 0);
  if (m === 0) {
    return 0;
  }
  const degrees = new Array(graph.nodeCount).fill(0);
  for (const edge of graph.edges) {
    const w = edge.weight ?? 1;
    degrees[edge.source] += w;
    degrees[edge.target] += w;
  }
  let total = 0;
  for (const edge of graph.edges) {
    if (clusters[edge.source] === clusters[edge.target]) {
      const w = edge.weight ?? 1;
      const expected = (degrees[edge.source] * degrees[edge.target]) / (2 * m);
      total += w - expected;
    }
  }
  return total / (2 * m);
}
