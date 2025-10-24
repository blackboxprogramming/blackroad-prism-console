import { mkdtempSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createGrid, createValueArray } from '../src/common/grid.js';
import { exportArtifacts } from '../src/io/artifacts.js';
import type { ArtifactSpec } from '../src/types.js';

describe('artifact export', () => {
  it('produces deterministic quiver text representation', () => {
    const grid = createGrid({ shape: [2, 2], spacing: [1, 1], origin: [0, 0] });
    const value = createValueArray(grid);
    value.set([0, 1, 2, 3]);
    const policy = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0]
    ];
    const dir = mkdtempSync(join(tmpdir(), 'hjb-artifacts-'));
    const spec: ArtifactSpec = {
      value,
      policy,
      grid,
      quiverPath: join(dir, 'quiver.png'),
      valuePath: join(dir, 'V.csv'),
      policyPath: join(dir, 'policy.csv'),
      rolloutPath: join(dir, 'rollout.webm')
    };
    exportArtifacts(spec);
    const quiver = readFileSync(spec.quiverPath, 'utf8');
    const golden = readFileSync(join(__dirname, 'golden/dubins.quiver.png.golden'), 'utf8');
    expect(quiver.trim()).toBe(golden.trim());
  });
});
