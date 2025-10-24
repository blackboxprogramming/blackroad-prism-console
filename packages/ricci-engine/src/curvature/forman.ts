import { CurvatureResult, WeightedGraph } from '../types';
import { withSpan } from '../otel';

export function computeFormanCurvature(graph: WeightedGraph): CurvatureResult {
  return withSpan('ricci.curvature.forman', () => {
    const degrees = new Array(graph.nodeCount).fill(0);
    for (const edge of graph.edges) {
      degrees[edge.source] += 1;
      degrees[edge.target] += 1;
    }
    const values = new Map<string, number>();
    let sum = 0;
    let negatives = 0;
    for (const edge of graph.edges) {
      const curvature = 4 - degrees[edge.source] - degrees[edge.target];
      values.set(edge.id, curvature);
      sum += curvature;
      if (curvature < 0) {
        negatives += 1;
      }
    }
    const averageKappa = graph.edges.length > 0 ? sum / graph.edges.length : 0;
    const negativeRatio = graph.edges.length > 0 ? negatives / graph.edges.length : 0;
    return {
      values,
      metrics: {
        averageKappa,
        negativeRatio
      }
    } satisfies CurvatureResult;
  });
}
