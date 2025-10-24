const { ensureBuilt } = require('./helpers/build');

beforeAll(() => {
  ensureBuilt();
});

const { computeOllivierCurvature } = require('../dist/curvature/ollivier');

function cycleGraph() {
  return {
    nodeCount: 4,
    edges: [
      { id: 'e0', source: 0, target: 1, weight: 1 },
      { id: 'e1', source: 1, target: 2, weight: 1 },
      { id: 'e2', source: 2, target: 3, weight: 1 },
      { id: 'e3', source: 3, target: 0, weight: 1 }
    ]
  };
}

describe('Ollivier curvature', () => {
  it('produces stable Sinkhorn transport', async () => {
    const graph = cycleGraph();
    const result = await computeOllivierCurvature(graph, { sinkhornEps: 0.05, sinkhornIters: 120 });
    expect(result.values.size).toBe(graph.edges.length);
    for (const value of result.values.values()) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThan(-2);
      expect(value).toBeLessThan(2);
    }
    expect(result.metrics.sinkhornIterations).toBeGreaterThan(0);
    expect(result.metrics.negativeRatio).toBeLessThanOrEqual(1);
  });
});
