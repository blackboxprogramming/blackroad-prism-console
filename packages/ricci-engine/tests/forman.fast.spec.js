const { ensureBuilt } = require('./helpers/build');

beforeAll(() => {
  ensureBuilt();
});

const { computeFormanCurvature } = require('../dist/curvature/forman');

function simpleGraph() {
  return {
    nodeCount: 4,
    edges: [
      { id: 'e0', source: 0, target: 1, weight: 1 },
      { id: 'e1', source: 1, target: 2, weight: 1 },
      { id: 'e2', source: 2, target: 3, weight: 1 }
    ]
  };
}

describe('Forman curvature', () => {
  it('matches 4 - deg(u) - deg(v)', () => {
    const graph = simpleGraph();
    const curvature = computeFormanCurvature(graph);
    expect(curvature.values.get('e0')).toBe(4 - 1 - 2);
    expect(curvature.values.get('e1')).toBe(4 - 2 - 2);
    expect(curvature.values.get('e2')).toBe(4 - 2 - 1);
    expect(curvature.metrics.averageKappa).toBeCloseTo((1 + 0 + 1) / 3, 5);
  });
});
