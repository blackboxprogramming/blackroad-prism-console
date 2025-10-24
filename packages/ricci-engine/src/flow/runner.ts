import { computeFormanCurvature } from '../curvature/forman';
import { computeOllivierCurvature } from '../curvature/ollivier';
import { ricciStep, weightStress } from './update';
import { CurvatureEngine, RicciFlowConfig, RicciFlowResult, RicciFlowStep, WeightedGraph } from '../types';

function withWeights(graph: WeightedGraph, weights: Map<string, number>): WeightedGraph {
  return {
    nodeCount: graph.nodeCount,
    edges: graph.edges.map((edge) => ({ ...edge, weight: weights.get(edge.id) ?? edge.weight }))
  };
}

async function computeCurvature(
  graph: WeightedGraph,
  engine: CurvatureEngine,
  config: RicciFlowConfig
) {
  if (engine === 'ollivier') {
    return computeOllivierCurvature(graph, {
      sinkhornEps: config.sinkhorn?.sinkhornEps ?? 0.01,
      sinkhornIters: config.sinkhorn?.sinkhornIters ?? 200,
      tolerance: config.sinkhorn?.tolerance ?? 1e-3
    });
  }
  return Promise.resolve(computeFormanCurvature(graph));
}

export async function runRicciFlow(graph: WeightedGraph, config: RicciFlowConfig): Promise<RicciFlowResult> {
  const weights = new Map<string, number>();
  for (const edge of graph.edges) {
    weights.set(edge.id, edge.weight);
  }
  const steps: RicciFlowStep[] = [];
  let stress = weightStress(weights);
  for (let iteration = 0; iteration < config.iterations; iteration += 1) {
    const currentGraph = withWeights(graph, weights);
    const curvature = await computeCurvature(currentGraph, config.curvature, config);
    const step = ricciStep(currentGraph, weights, curvature, config, iteration, stress);
    steps.push(step);
    stress = step.stress;
    for (const [edgeId, value] of step.weights) {
      weights.set(edgeId, value);
    }
  }
  const finalCurvature = steps.length > 0 ? steps[steps.length - 1].curvature : { values: new Map(), metrics: { averageKappa: 0, negativeRatio: 0 } };
  return {
    steps,
    finalWeights: weights,
    finalCurvature
  } satisfies RicciFlowResult;
}
