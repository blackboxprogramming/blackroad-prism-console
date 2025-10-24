import { WeightedGraph } from '../types';

export function enforceWeightFloor<T>(values: Map<T, number>, epsilon: number): Map<T, number> {
  const next = new Map<T, number>();
  for (const [key, value] of values) {
    next.set(key, Math.max(epsilon, value));
  }
  return next;
}

export function normalizeWeights<T>(values: Map<T, number>, targetSum: number): Map<T, number> {
  let sum = 0;
  for (const value of values.values()) {
    sum += value;
  }
  if (sum === 0) {
    return values;
  }
  const scale = targetSum / sum;
  const next = new Map<T, number>();
  for (const [key, value] of values) {
    next.set(key, value * scale);
  }
  return next;
}

export function isGraphConnected(graph: WeightedGraph, weights: Map<string, number>, epsilon: number): boolean {
  if (graph.nodeCount === 0) {
    return true;
  }
  const adjacency: number[][] = Array.from({ length: graph.nodeCount }, () => []);
  for (const edge of graph.edges) {
    const weight = weights.get(edge.id) ?? edge.weight;
    if (weight <= epsilon) {
      continue;
    }
    adjacency[edge.source].push(edge.target);
    adjacency[edge.target].push(edge.source);
  }
  const visited = new Array(graph.nodeCount).fill(false);
  const queue = [0];
  visited[0] = true;
  while (queue.length > 0) {
    const node = queue.shift()!;
    for (const neighbor of adjacency[node]) {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        queue.push(neighbor);
      }
    }
  }
  return visited.every(Boolean);
}
