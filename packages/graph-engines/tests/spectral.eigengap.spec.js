const { ensureBuilt } = require('./helpers/build');

beforeAll(() => {
  ensureBuilt();
});

const { spectralEmbedding } = require('../dist/spectral/embed');

describe('spectralEmbedding', () => {
  it('computes sorted eigenvalues and eigengap', () => {
    const graph = {
      nodes: 4,
      edges: [
        { source: 0, target: 1 },
        { source: 1, target: 2 },
        { source: 2, target: 3 }
      ]
    };

    const result = spectralEmbedding(graph, { k: 3, seed: 11 });
    const sorted = [...result.eigenvalues].sort((a, b) => a - b);
    expect(result.eigenvalues).toEqual(sorted);
    expect(result.metrics.eigengap.length).toBe(2);
    expect(result.metrics.eigengap[0]).toBeGreaterThanOrEqual(0);
    expect(result.metrics.conductance.length).toBe(3);
  });
});
