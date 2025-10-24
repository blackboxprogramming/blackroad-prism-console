import { WeightedGraph } from '../types';
import { enforceWeightFloor, isGraphConnected, normalizeWeights } from './constraints';

export interface LineSearchOptions {
  graph: WeightedGraph;
  currentWeights: Map<string, number>;
  curvature: Map<string, number>;
  tau: number;
  targetKappa: number;
  epsilon: number;
  minTau: number;
  renormalize: boolean;
  evaluateStress?: (weights: Map<string, number>) => number;
  previousStress?: number;
  maxBacktracks?: number;
}

export interface LineSearchResult {
  weights: Map<string, number>;
  tau: number;
  stress: number;
  backtracks: number;
}

function applyUpdate(
  graph: WeightedGraph,
  currentWeights: Map<string, number>,
  curvature: Map<string, number>,
  tau: number,
  targetKappa: number
): Map<string, number> {
  const next = new Map<string, number>();
  for (const edge of graph.edges) {
    const weight = currentWeights.get(edge.id) ?? edge.weight;
    const kappa = (curvature.get(edge.id) ?? 0) - targetKappa;
    const updated = weight * (1 - tau * kappa);
    next.set(edge.id, updated);
  }
  return next;
}

export function backtrackStep(options: LineSearchOptions): LineSearchResult {
  const {
    graph,
    currentWeights,
    curvature,
    targetKappa,
    epsilon,
    minTau,
    renormalize,
    evaluateStress,
    previousStress,
    maxBacktracks = 8
  } = options;
  let tau = options.tau;
  const originalSum = Array.from(currentWeights.values()).reduce((sum, value) => sum + value, 0);
  let stress = previousStress ?? 0;
  let backtracks = 0;
  while (true) {
    const proposed = applyUpdate(graph, currentWeights, curvature, tau, targetKappa);
    const floored = enforceWeightFloor(proposed, epsilon);
    const renormalized = renormalize ? normalizeWeights(floored, originalSum) : floored;
    const connected = isGraphConnected(graph, renormalized, epsilon);
    let ok = connected;
    if (ok && evaluateStress) {
      stress = evaluateStress(renormalized);
      if (previousStress !== undefined && stress > previousStress * 1.05) {
        ok = false;
      }
    }
    if (ok) {
      return { weights: renormalized, tau, stress, backtracks };
    }
    backtracks += 1;
    if (backtracks >= maxBacktracks || tau * 0.5 < minTau) {
      return { weights: renormalized, tau, stress, backtracks };
    }
    tau *= 0.5;
  }
}
