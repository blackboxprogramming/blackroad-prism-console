import { DensityField, PowerLloydOptions, PowerLloydResult, PowerLloydSite } from '../types';
import { computePowerDiagram, densityWeightedCentroid } from './power_cells';

function cloneSites(sites: PowerLloydSite[]): PowerLloydSite[] {
  return sites.map((site) => ({
    position: [site.position[0], site.position[1]],
    weight: site.weight,
    targetMass: site.targetMass
  }));
}

export function runPowerLloyd(
  density: DensityField,
  sites: PowerLloydSite[],
  options: PowerLloydOptions
): PowerLloydResult {
  const workingSites = cloneSites(sites);
  const history: number[] = [];
  const massErrors: number[] = [];

  for (let iter = 0; iter < options.iterations; iter += 1) {
    const diagram = computePowerDiagram(density, workingSites);
    let maxMove = 0;
    let massError = 0;

    for (let idx = 0; idx < workingSites.length; idx += 1) {
      const centroid = densityWeightedCentroid(density, diagram.assignments, idx);
      const dx = centroid[0] - workingSites[idx].position[0];
      const dy = centroid[1] - workingSites[idx].position[1];
      const move = Math.sqrt(dx * dx + dy * dy);
      workingSites[idx].position = centroid;
      if (workingSites[idx].targetMass !== undefined) {
        const diff = workingSites[idx].targetMass - diagram.masses[idx];
        workingSites[idx].weight += diff * 0.5;
        massError = Math.max(massError, Math.abs(diff));
      }
      maxMove = Math.max(maxMove, move);
    }

    history.push(maxMove);
    massErrors.push(massError);

    if (maxMove < options.movementTolerance && massError < options.massTolerance) {
      break;
    }
  }

  return { sites: workingSites, history, massErrors };
}
