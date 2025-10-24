import { GraphData } from '../types';

export interface LaplacianResult {
  matrix: number[][];
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
}
