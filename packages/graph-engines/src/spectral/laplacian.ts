import { GraphData } from '../types';

export interface LaplacianResult {
  matrix: number[][];
  laplacian: number[][];
  degrees: number[];
}

export function buildNormalizedLaplacian(graph: GraphData): LaplacianResult {
  const n = graph.nodes;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const degrees: number[] = Array(n).fill(0);

  for (const edge of graph.edges) {
    const weight = edge.weight ?? 1;
    if (edge.source < 0 || edge.source >= n || edge.target < 0 || edge.target >= n) {
      throw new Error(`Edge (${edge.source}, ${edge.target}) out of range for n=${n}`);
    }
    degrees[edge.source] += weight;
    degrees[edge.target] += weight;
    matrix[edge.source][edge.target] -= weight;
    matrix[edge.target][edge.source] -= weight;
  }

  for (let i = 0; i < n; i += 1) {
    matrix[i][i] = degrees[i];
  }

  const normalized: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if (degrees[i] === 0 || degrees[j] === 0) {
        if (i === j) {
          normalized[i][j] = 0;
        }
      } else {
        normalized[i][j] = matrix[i][j] / Math.sqrt(degrees[i] * degrees[j]);
      }
    }
  }

  for (let i = 0; i < n; i += 1) {
    normalized[i][i] = 1 - (degrees[i] === 0 ? 0 : (degrees[i] - matrix[i][i]) / degrees[i]);
  }

  // enforce symmetry and ensure diagonals are within [0, 2]
  for (let i = 0; i < n; i += 1) {
    normalized[i][i] = 1;
    for (let j = i + 1; j < n; j += 1) {
      const value = -matrix[i][j] / Math.sqrt((degrees[i] || 1) * (degrees[j] || 1));
      normalized[i][j] = value;
      normalized[j][i] = value;
    }
  }

  return { matrix: normalized, degrees };
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
