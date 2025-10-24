import { CurvatureResult, OllivierConfig, WeightedGraph } from '../types';
import { buildAdjacency, edgeLength, shortestPaths } from '../graph';
import { withSpan } from '../otel';

async function wasserstein1(
  mu: Float64Array,
  nu: Float64Array,
  cost: Float64Array,
  rows: number,
  cols: number,
  config: OllivierConfig
): Promise<{ transportCost: number; iterations: number }> {
  const module = await import('@blackroad/sb-engine/sinkhorn/logsinkhorn.js');
  const { logSinkhorn } = module;
  const result = logSinkhorn(mu, nu, cost, rows, cols, {
    epsilon: config.sinkhornEps,
    maxIterations: config.sinkhornIters,
    tolerance: config.tolerance ?? 1e-3,
    checkInterval: 1
  });
  let transportCost = 0;
  for (let i = 0; i < rows * cols; i += 1) {
    transportCost += result.coupling[i] * cost[i];
  }
  return { transportCost, iterations: result.iterations };
}

export async function computeOllivierCurvature(
  graph: WeightedGraph,
  config: OllivierConfig
): Promise<CurvatureResult> {
  return withSpan('ricci.curvature.ollivier', async () => {
      const adjacency = buildAdjacency(graph);
      const distancesCache = new Map<number, Float64Array>();
      const values = new Map<string, number>();
      let sum = 0;
      let negatives = 0;
      let iterations = 0;
      for (const edge of graph.edges) {
        const neighborsU = adjacency[edge.source];
        const neighborsV = adjacency[edge.target];
        if (neighborsU.length === 0 || neighborsV.length === 0) {
          values.set(edge.id, 0);
          continue;
        }
        let distU = distancesCache.get(edge.source);
        if (!distU) {
          distU = shortestPaths(adjacency, edge.source);
          distancesCache.set(edge.source, distU);
        }
        let distV = distancesCache.get(edge.target);
        if (!distV) {
          distV = shortestPaths(adjacency, edge.target);
          distancesCache.set(edge.target, distV);
        }
        const rows = neighborsU.length;
        const cols = neighborsV.length;
        const mu = new Float64Array(rows);
        const nu = new Float64Array(cols);
        mu.fill(1 / rows);
        nu.fill(1 / cols);
        const cost = new Float64Array(rows * cols);
        for (let i = 0; i < rows; i += 1) {
          const neighborU = neighborsU[i];
          for (let j = 0; j < cols; j += 1) {
            const neighborV = neighborsV[j];
            const idx = i * cols + j;
            const distance = distU[neighborV.node] ?? Infinity;
            const alternative = distV[neighborU.node];
            cost[idx] = Math.min(distance, alternative);
          }
        }
        const { transportCost, iterations: sinkhornIterations } = await wasserstein1(
          mu,
          nu,
          cost,
          rows,
          cols,
          config
        );
        iterations += sinkhornIterations;
        const baseDistance = edgeLength(edge);
        const curvature = 1 - transportCost / Math.max(baseDistance, 1e-9);
        if (!Number.isFinite(curvature)) {
          values.set(edge.id, 0);
          continue;
        }
        values.set(edge.id, curvature);
        sum += curvature;
        if (curvature < 0) {
          negatives += 1;
        }
      }
      const averageKappa = graph.edges.length > 0 ? sum / graph.edges.length : 0;
      const negativeRatio = graph.edges.length > 0 ? negatives / graph.edges.length : 0;
      const sinkhornIterations = graph.edges.length > 0 ? iterations / graph.edges.length : 0;
      return {
        values,
        metrics: {
          averageKappa,
          negativeRatio,
          sinkhornIterations
        }
      } satisfies CurvatureResult;
  });
}
