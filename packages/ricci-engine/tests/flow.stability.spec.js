const { ensureBuilt } = require('./helpers/build');

beforeAll(() => {
  ensureBuilt();
});

const { runRicciFlow } = require('../dist/flow/runner');

function pathGraph() {
  return {
    nodeCount: 5,
    edges: [
      { id: 'e0', source: 0, target: 1, weight: 1 },
      { id: 'e1', source: 1, target: 2, weight: 1 },
      { id: 'e2', source: 2, target: 3, weight: 1 },
      { id: 'e3', source: 3, target: 4, weight: 1 }
    ]
  };
}

describe('Ricci flow stability', () => {
  it('maintains connectivity and weight positivity', async () => {
    const graph = pathGraph();
    const result = await runRicciFlow(graph, {
      curvature: 'forman',
      tau: 0.05,
      iterations: 5,
      epsilonW: 1e-3,
      targetKappa: 0,
      renormalize: true
    });
    const finalWeights = Array.from(result.finalWeights.values());
    finalWeights.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(1e-3);
    });
    const sum = finalWeights.reduce((acc, value) => acc + value, 0);
    expect(sum).toBeCloseTo(graph.edges.length, 2);
    const stresses = result.steps.map((step) => step.stress);
    expect(stresses[stresses.length - 1]).toBeLessThanOrEqual(stresses[0]);
  });
});
