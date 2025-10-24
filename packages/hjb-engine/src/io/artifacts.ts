import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { coordsFromIndex, positionFromCoords } from '../common/grid.js';
import type { ArtifactSpec } from '../types.js';

function ensureDir(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

export function exportArtifacts(spec: ArtifactSpec) {
  ensureDir(spec.valuePath);
  ensureDir(spec.policyPath);
  ensureDir(spec.quiverPath);
  ensureDir(spec.rolloutPath);

  const grid = spec.grid;
  const dims = grid.spec.shape.length;
  const header = Array.from({ length: dims }, (_, i) => `x${i}`).join(',');

  const valueLines: string[] = [`${header},value`];
  const policyLines: string[] = [`${header},${spec.policy[0].map((_, i) => `u${i}`).join(',')}`];

  for (let index = 0; index < grid.size; index += 1) {
    const coords = coordsFromIndex(grid, index);
    const position = positionFromCoords(grid, coords);
    const coordStr = position.map((v) => v.toFixed(6)).join(',');
    valueLines.push(`${coordStr},${spec.value[index].toFixed(6)}`);
    const policyVector = spec.policy[index] ?? new Array(spec.policy[0].length).fill(0);
    policyLines.push(`${coordStr},${policyVector.map((v) => v.toFixed(6)).join(',')}`);
  }

  writeFileSync(spec.valuePath, valueLines.join('\n'));
  writeFileSync(spec.policyPath, policyLines.join('\n'));

  if (grid.spec.shape.length >= 2) {
    const width = grid.spec.shape[0];
    const height = grid.spec.shape[1];
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < spec.value.length; i += 1) {
      const v = spec.value[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const span = max - min || 1;
    const lines: string[] = [];
    for (let y = 0; y < height; y += 1) {
      const row: string[] = [];
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        const normalized = (spec.value[index] - min) / span;
        row.push(normalized.toFixed(4));
      }
      lines.push(row.join(','));
    }
    const content = ['BRCQUIVER1', `width=${width}`, `height=${height}`, ...lines].join('\n');
    writeFileSync(spec.quiverPath, content);
  } else {
    writeFileSync(spec.quiverPath, 'BRCQUIVER1\nwidth=0\nheight=0');
  }

  const rollout = spec.rollout;
  const payload = {
    format: 'blackroad-rollout',
    version: 1,
    steps: rollout?.samples.length ?? 0,
    cost: rollout?.totalCost ?? null,
    samples: rollout?.samples ?? []
  };
  writeFileSync(spec.rolloutPath, Buffer.from(JSON.stringify(payload, null, 2)));
}
