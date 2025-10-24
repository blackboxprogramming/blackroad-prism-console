import { WeightedEdge, WeightedGraph } from './types';

export interface Neighbor {
  node: number;
  weight: number;
}

export function buildAdjacency(graph: WeightedGraph): Neighbor[][] {
  const adjacency: Neighbor[][] = Array.from({ length: graph.nodeCount }, () => []);
  for (const edge of graph.edges) {
    adjacency[edge.source].push({ node: edge.target, weight: edge.weight });
    adjacency[edge.target].push({ node: edge.source, weight: edge.weight });
  }
  return adjacency;
}

export function edgeLength(edge: WeightedEdge): number {
  const weight = Math.max(edge.weight, 1e-9);
  return 1 / weight;
}

export function shortestPaths(adjacency: Neighbor[][], start: number): Float64Array {
  const distances = new Float64Array(adjacency.length).fill(Infinity);
  const visited = new Array(adjacency.length).fill(false);
  distances[start] = 0;
  for (let iter = 0; iter < adjacency.length; iter += 1) {
    let node = -1;
    let best = Infinity;
    for (let i = 0; i < adjacency.length; i += 1) {
      if (!visited[i] && distances[i] < best) {
        best = distances[i];
        node = i;
      }
    }
    if (node === -1) {
      break;
    }
    visited[node] = true;
    for (const neighbor of adjacency[node]) {
      const cost = 1 / Math.max(neighbor.weight, 1e-9);
      const candidate = distances[node] + cost;
      if (candidate < distances[neighbor.node]) {
        distances[neighbor.node] = candidate;
      }
    }
  }
  return distances;
}

export function distanceMatrix(graph: WeightedGraph): number[][] {
  const adjacency = buildAdjacency(graph);
  return adjacency.map((_, idx) => Array.from(shortestPaths(adjacency, idx)));
}
