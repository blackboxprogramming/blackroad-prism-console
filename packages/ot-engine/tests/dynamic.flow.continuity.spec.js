const { buildDynamicInterpolation } = require('../src');

function makeBump(width, height, cx, cy, sigma) {
  const field = { width, height, data: new Float64Array(width * height) };
  let sum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - cx) / sigma;
      const dy = (y - cy) / sigma;
      const value = Math.exp(-0.5 * (dx * dx + dy * dy));
      field.data[y * width + x] = value;
      sum += value;
    }
  }
  for (let i = 0; i < field.data.length; i++) {
    field.data[i] /= sum;
  }
  return field;
}

describe('dynamic OT solver', () => {
  it('produces flows that satisfy the discrete continuity equation', () => {
    const width = 16;
    const height = 12;
    const rho0 = makeBump(width, height, 4, 6, 3);
    const rho1 = makeBump(width, height, 11, 6, 3);
    const result = buildDynamicInterpolation({ rho0, rho1, steps: 6 });
    expect(result.frames).toHaveLength(7);
    expect(result.flows).toHaveLength(6);
    expect(result.continuityResidual).toBeLessThan(5e-3);
    expect(result.totalCost).toBeGreaterThan(0);
    for (const flow of result.flows) {
      for (let i = 0; i < flow.vx.length; i++) {
        expect(Number.isFinite(flow.vx[i])).toBe(true);
        expect(Number.isFinite(flow.vy[i])).toBe(true);
      }
    }
  });
});
