import { CurvatureResult, RicciFlowConfig, RicciFlowStep, WeightedGraph } from '../types';
import { backtrackStep } from './line_search';
import { withSpan } from '../otel';

function weightStress(weights: Map<string, number>): number {
  const entries = Array.from(weights.values());
  if (entries.length === 0) {
    return 0;
  }
  const mean = entries.reduce((sum, value) => sum + value, 0) / entries.length;
  return entries.reduce((acc, value) => acc + (value - mean) ** 2, 0);
}

export function ricciStep(
  graph: WeightedGraph,
  weights: Map<string, number>,
  curvature: CurvatureResult,
  config: RicciFlowConfig,
  iteration: number,
  previousStress?: number
): RicciFlowStep {
  return withSpan('ricci.flow.step', () => {
    const next = backtrackStep({
      graph,
      currentWeights: weights,
      curvature: curvature.values,
      tau: config.tau,
      targetKappa: config.targetKappa ?? 0,
      epsilon: config.epsilonW,
      minTau: config.minTau ?? config.tau / 16,
      renormalize: config.renormalize ?? true,
      evaluateStress: weightStress,
      previousStress
    });
    return {
      iteration,
      tau: next.tau,
      curvature,
      weights: next.weights,
      stress: next.stress,
      backtracks: next.backtracks
    } satisfies RicciFlowStep;
  });
}

export { weightStress };
