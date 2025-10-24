const { ensureBuilt } = require('./helpers/build');

beforeAll(() => {
  ensureBuilt();
});

const { metricMds } = require('../dist/embed/mds');
const { runRicciFlow } = require('../dist/flow/runner');

function ladderGraph() {
  return {
    nodeCount: 6,
    edges: [
      { id: 'e0', source: 0, target: 1, weight: 1 },
      { id: 'e1', source: 1, target: 2, weight: 1 },
      { id: 'e2', source: 3, target: 4, weight: 1 },
      { id: 'e3', source: 4, target: 5, weight: 1 },
      { id: 'e4', source: 0, target: 3, weight: 0.8 },
      { id: 'e5', source: 1, target: 4, weight: 0.8 },
      { id: 'e6', source: 2, target: 5, weight: 0.8 }
    ]
  };
}

describe('Ricci flow embeddings', () => {
  it('reduces MDS stress after flowing weights', async () => {
    const graph = ladderGraph();
    const baseline = metricMds(graph);
    const flow = await runRicciFlow(graph, {
      curvature: 'forman',
      tau: 0.04,
      iterations: 6,
      epsilonW: 1e-3,
      targetKappa: -0.05,
      renormalize: true
    });
    const flowedGraph = {
      nodeCount: graph.nodeCount,
      edges: graph.edges.map((edge) => ({ ...edge, weight: flow.finalWeights.get(edge.id) ?? edge.weight }))
    };
    const flowed = metricMds(flowedGraph);
    expect(flowed.stress).toBeLessThan(baseline.stress);
  });
});
