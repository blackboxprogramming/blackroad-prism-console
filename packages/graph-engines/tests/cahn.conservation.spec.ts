import { createGrid } from '../src/cahn-hilliard/grid';
import { runCahnHilliard } from '../src/cahn-hilliard/semi_implicit';
import path from 'node:path';
import fs from 'node:fs';

describe('cahn-hilliard phase field', () => {
  const artifactDir = path.join(__dirname, 'tmp-cahn');
  beforeAll(() => {
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
  });
  afterAll(() => {
    fs.rmSync(artifactDir, { recursive: true, force: true });
  });

  it('conserves mass within tolerance', () => {
    const initial = createGrid({ width: 16, height: 16, seed: 5 });
    const initialMean = initial.values.reduce((acc, value) => acc + value, 0) / initial.values.length;
    const result = runCahnHilliard(initial, {
      epsilon: 1.2,
      dt: 0.1,
      steps: 12,
      artifactDir
    });
    const finalMean = result.grid.values.reduce((acc, value) => acc + value, 0) / result.grid.values.length;
    expect(Math.abs(finalMean - initialMean)).toBeLessThan(1e-5);
    expect(result.residuals.length).toBe(12);
  });
});
