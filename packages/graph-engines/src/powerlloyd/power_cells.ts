import { DensityField, PowerLloydSite } from '../types';

export interface PowerDiagram {
  assignments: number[];
  masses: number[];
}

export function computePowerDiagram(
  density: DensityField,
  sites: PowerLloydSite[]
): PowerDiagram {
  const assignments = new Array(density.width * density.height).fill(0);
  const masses = new Array(sites.length).fill(0);

  for (let idx = 0; idx < assignments.length; idx += 1) {
    const x = idx % density.width;
    const y = Math.floor(idx / density.width);
    const point: [number, number] = [x / (density.width - 1), y / (density.height - 1)];
    let best = 0;
    let bestValue = Infinity;
    for (let i = 0; i < sites.length; i += 1) {
      const site = sites[i];
      const dx = point[0] - site.position[0];
      const dy = point[1] - site.position[1];
      const power = dx * dx + dy * dy - site.weight;
      if (power < bestValue) {
        best = i;
        bestValue = power;
      }
    }
    assignments[idx] = best;
    masses[best] += density.values[idx];
  }

  return { assignments, masses };
}

export function densityWeightedCentroid(
  density: DensityField,
  assignments: number[],
  target: number
): [number, number] {
  let mass = 0;
  let cx = 0;
  let cy = 0;
  for (let idx = 0; idx < assignments.length; idx += 1) {
    if (assignments[idx] !== target) {
      continue;
    }
    const weight = density.values[idx];
    const x = idx % density.width;
    const y = Math.floor(idx / density.width);
    cx += weight * (x / (density.width - 1));
    cy += weight * (y / (density.height - 1));
    mass += weight;
  }
  if (mass === 0) {
    return [0.5, 0.5];
  }
  return [cx / mass, cy / mass];
}
