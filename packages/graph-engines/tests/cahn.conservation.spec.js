const { ensureBuilt } = require('./helpers/build');

beforeAll(() => {
  ensureBuilt();
});

const { runCahnHilliard } = require('../dist/cahn-hilliard/semi_implicit');
const { createPhaseField } = require('../dist/cahn-hilliard/grid');

describe('runCahnHilliard', () => {
  it('conserves total mass approximately', () => {
    const field = createPhaseField(8, 8);
    for (let i = 0; i < field.values.length; i += 1) {
      field.values[i] = i % 2 === 0 ? 0.2 : -0.2;
    }

    const initialMass = field.values.reduce((sum, value) => sum + value, 0);
    const result = runCahnHilliard({ field }, { epsilon: 1.2, dt: 0.05, steps: 20, recordEvery: 5 });
    const finalMass = result.mass;

    expect(Math.abs(initialMass - finalMass)).toBeLessThan(1e-6);
    expect(result.residuals.length).toBe(20);
  });
});
