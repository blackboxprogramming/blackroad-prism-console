const { ensureBuilt } = require('./helpers/build');

beforeAll(() => {
  ensureBuilt();
});

const { densityFromEmbedding } = require('../dist/powerlloyd/density');
const { runPowerLloyd } = require('../dist/powerlloyd/iterate');

describe('runPowerLloyd', () => {
  it('reduces movement over iterations', () => {
    const density = densityFromEmbedding(
      [
        [0, 0],
        [1, 1],
        [0.2, 0.7],
        [0.8, 0.3]
      ],
      { width: 16, height: 16, bandwidth: 0.3 }
    );

    const sites = [
      { position: [0.25, 0.25], weight: 0, targetMass: 0.5 },
      { position: [0.75, 0.75], weight: 0, targetMass: 0.5 }
    ];

    const result = runPowerLloyd(density, sites, {
      iterations: 10,
      massTolerance: 0.1,
      movementTolerance: 1e-3
    });

    expect(result.history[0]).toBeGreaterThan(result.history[result.history.length - 1]);
  });
});
