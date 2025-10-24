const fs = require('fs');
const path = require('path');
const { solveWeights, rasterizePowerDiagram } = require('../src');

function gaussianDensity(width, height, cx, cy, sigma) {
  const data = new Float64Array(width * height);
  let sum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - cx) / sigma;
      const dy = (y - cy) / sigma;
      const value = Math.exp(-0.5 * (dx * dx + dy * dy));
      data[y * width + x] = value;
      sum += value;
    }
  }
  for (let i = 0; i < data.length; i++) {
    data[i] /= sum;
  }
  return { width, height, data, cellArea: 1 };
}

function renderOwner(owner, width, height) {
  let rows = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      row += owner[y * width + x].toString(16);
    }
    rows.push(row);
  }
  return rows.join('\n');
}

describe('semi-discrete OT solver', () => {
  it('matches target masses within tolerance and stays deterministic', () => {
    const density = gaussianDensity(24, 24, 8, 16, 6);
    const sites = [
      { x: 6, y: 8 },
      { x: 18, y: 12 },
      { x: 10, y: 20 },
    ];
    const totalMass = 1;
    const target = [totalMass / 3, totalMass / 3, totalMass / 3];
    const result = solveWeights({
      density,
      sites,
      targetMasses: target,
      options: { maxIterations: 80, tolerance: 0.01 },
    });
    expect(result.converged).toBe(true);
    const computedTotal = result.masses.reduce((a, b) => a + b, 0);
    expect(computedTotal).toBeCloseTo(totalMass, 1);
    for (let i = 0; i < target.length; i++) {
      const rel = Math.abs(result.masses[i] - target[i]) / target[i];
      expect(rel).toBeLessThan(0.01);
    }
    const { owner } = rasterizePowerDiagram(
      sites,
      Array.from(result.weights),
      density,
      { includeMass: false }
    );
    const ascii = renderOwner(owner, density.width, density.height);
    const goldenPath = path.join(__dirname, 'golden', 'ot_gaussians.png.golden');
    const golden = fs.readFileSync(goldenPath, 'utf8');
    expect(ascii).toBe(golden);
  });
});
