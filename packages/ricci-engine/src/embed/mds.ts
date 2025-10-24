import { distanceMatrix } from '../graph';
import { LayoutResult, WeightedGraph } from '../types';
import { jacobiEigenDecomposition } from './eigen';

function doubleCenter(distances: number[][]): number[][] {
  const n = distances.length;
  const centered = Array.from({ length: n }, () => new Array(n).fill(0));
  const rowMeans = new Array(n).fill(0);
  const colMeans = new Array(n).fill(0);
  let total = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const value = distances[i][j] ** 2;
      rowMeans[i] += value;
      colMeans[j] += value;
      total += value;
    }
  }
  for (let i = 0; i < n; i += 1) {
    rowMeans[i] /= n;
    colMeans[i] /= n;
  }
  total /= n * n;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      centered[i][j] = -0.5 * (distances[i][j] ** 2 - rowMeans[i] - colMeans[j] + total);
    }
  }
  return centered;
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function computeStress(original: number[][], embedding: number[][]): number {
  let stress = 0;
  for (let i = 0; i < original.length; i += 1) {
    for (let j = i + 1; j < original.length; j += 1) {
      const d0 = original[i][j];
      const d1 = euclideanDistance(embedding[i], embedding[j]);
      const diff = d0 - d1;
      stress += diff * diff;
    }
  }
  return stress;
}

export function metricMds(graph: WeightedGraph, dimensions = 2): LayoutResult {
  const distances = distanceMatrix(graph);
  const gram = doubleCenter(distances);
  const { eigenvalues, eigenvectors } = jacobiEigenDecomposition(gram);
  const eigenPairs = eigenvalues.map((value, index) => ({ value, vector: eigenvectors.map((row) => row[index]) }));
  eigenPairs.sort((a, b) => b.value - a.value);
  const embedding = Array.from({ length: graph.nodeCount }, () => new Array(dimensions).fill(0));
  for (let dim = 0; dim < dimensions; dim += 1) {
    const pair = eigenPairs[dim];
    const magnitude = Math.sqrt(Math.max(pair?.value ?? 0, 0));
    const vector = pair?.vector ?? new Array(graph.nodeCount).fill(0);
    for (let i = 0; i < graph.nodeCount; i += 1) {
      embedding[i][dim] = vector[i] * magnitude;
    }
  }
  const stress = computeStress(distances, embedding);
  return {
    embedding,
    stress,
    method: 'mds'
  } satisfies LayoutResult;
}
