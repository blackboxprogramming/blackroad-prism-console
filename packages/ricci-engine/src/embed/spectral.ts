import { distanceMatrix } from '../graph';
import { LayoutResult, WeightedGraph } from '../types';
import { jacobiEigenDecomposition } from './eigen';

function computeStress(original: number[][], embedding: number[][]): number {
  let stress = 0;
  for (let i = 0; i < original.length; i += 1) {
    for (let j = i + 1; j < original.length; j += 1) {
      const diff = original[i][j] - euclideanDistance(embedding[i], embedding[j]);
      stress += diff * diff;
    }
  }
  return stress;
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const delta = a[i] - b[i];
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

export function spectralLayout(graph: WeightedGraph, dimensions = 2): LayoutResult {
  const n = graph.nodeCount;
  const adjacency = Array.from({ length: n }, () => new Array(n).fill(0));
  const degrees = new Array(n).fill(0);
  for (const edge of graph.edges) {
    adjacency[edge.source][edge.target] += edge.weight;
    adjacency[edge.target][edge.source] += edge.weight;
    degrees[edge.source] += edge.weight;
    degrees[edge.target] += edge.weight;
  }
  const laplacian = Array.from({ length: n }, (_, i) => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    laplacian[i][i] = 1;
    for (let j = 0; j < n; j += 1) {
      if (i === j) {
        continue;
      }
      if (adjacency[i][j] === 0) {
        continue;
      }
      const normalization = Math.sqrt(Math.max(degrees[i], 1e-9) * Math.max(degrees[j], 1e-9));
      laplacian[i][j] = -adjacency[i][j] / normalization;
    }
  }
  const { eigenvalues, eigenvectors } = jacobiEigenDecomposition(laplacian, 96, 1e-9);
  const eigenPairs = eigenvalues.map((value, index) => ({ value, vector: eigenvectors.map((row) => row[index]) }));
  eigenPairs.sort((a, b) => a.value - b.value);
  const embedding = Array.from({ length: n }, () => new Array(dimensions).fill(0));
  for (let dim = 0; dim < dimensions; dim += 1) {
    const pair = eigenPairs[dim + 1];
    const vector = pair?.vector ?? new Array(n).fill(0);
    for (let i = 0; i < n; i += 1) {
      embedding[i][dim] = vector[i];
    }
  }
  const stress = computeStress(distanceMatrix(graph), embedding);
  return {
    embedding,
    stress,
    method: 'spectral'
  } satisfies LayoutResult;
}
