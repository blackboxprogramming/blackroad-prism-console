import { gaussianDensity } from '../src/powerlloyd/density';
import { iteratePowerLloyd } from '../src/powerlloyd/iterate';
import { createSeededRng } from '../src/determinism';
import path from 'node:path';
import fs from 'node:fs';

describe('power lloyd iteration', () => {
  const artifactDir = path.join(__dirname, 'tmp-power');
  beforeAll(() => {
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
  });
  afterAll(() => {
    fs.rmSync(artifactDir, { recursive: true, force: true });
  });

  it('reduces movement and mass error', () => {
    const density = gaussianDensity({ width: 24, height: 24, seed: 11 });
    const rng = createSeededRng(3);
    const points = Array.from({ length: 4 }, () => ({
      x: Math.floor(rng() * density.width),
      y: Math.floor(rng() * density.height),
      weight: 0
    }));
    const result = iteratePowerLloyd(points, density, {
      maxIterations: 12,
      tolerance: 1e-3,
      massTolerance: 1e-3,
      artifactDir
    });
    expect(result.metrics.movementHistory[0]).toBeGreaterThanOrEqual(result.metrics.movementHistory.at(-1)!);
    expect(result.metrics.massErrorHistory[0]).toBeGreaterThanOrEqual(result.metrics.massErrorHistory.at(-1)!);
  });
});
