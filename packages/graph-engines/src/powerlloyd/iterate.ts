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
import { DensityField, PowerLloydState } from '../types';
import { writeBinaryArtifact, writeTextArtifact } from '../io/artifacts';
import { computePowerCells } from './power_cells';

export interface PowerLloydOptions {
  maxIterations: number;
  tolerance: number;
  massTolerance: number;
  artifactDir?: string;
}

export function iteratePowerLloyd(
  initial: { x: number; y: number; weight: number }[],
  density: DensityField,
  options: PowerLloydOptions
): PowerLloydState {
  let points = initial.map((point) => ({ ...point }));
  const movementHistory: number[] = [];
  const massErrorHistory: number[] = [];
  let lastMovement = Infinity;
  let lastMassError = Infinity;
  let iteration = 0;
  let owner = new Uint16Array(density.width * density.height);
  while (iteration < options.maxIterations) {
    const result = computePowerCells(points, density);
    owner = new Uint16Array(result.owner);
    const totalMass = result.mass.reduce((acc, value) => acc + value, 0) || 1;
    const targetMass = totalMass / points.length;
    lastMassError = rootMeanSquare(result.mass.map((mass) => mass - targetMass));
    const nextPoints = points.map((point, idx) => {
      const centroid = result.centroids[idx];
      return {
        x: centroid.x,
        y: centroid.y,
        weight: point.weight - (result.mass[idx] - targetMass) * 0.1
      };
    });
    lastMovement = rootMeanSquare(
      points.map((point, idx) => (point.x - nextPoints[idx].x) ** 2 + (point.y - nextPoints[idx].y) ** 2)
    );
    points = nextPoints;
    movementHistory.push(Number(lastMovement.toFixed(6)));
    massErrorHistory.push(Number(lastMassError.toFixed(6)));
    iteration += 1;
    if (lastMovement < options.tolerance && lastMassError < options.massTolerance) {
      break;
    }
  }
  const asciiArtifact = writeBinaryArtifact(
    'power_lloyd_cells.png',
    renderAscii(owner, density.width, density.height, points.length),
    'ASCII raster of power diagram cells',
    'png',
    { baseDir: options.artifactDir }
  );
  const metricsArtifact = writeTextArtifact(
    'power_lloyd_metrics.json',
    JSON.stringify(
      {
        movementHistory,
        massErrorHistory
      },
      null,
      2
    ),
    'Power-Lloyd convergence traces',
    'json',
    { baseDir: options.artifactDir }
  );
  return {
    points,
    iteration,
    movement: Number(lastMovement.toFixed(6)),
    massError: Number(lastMassError.toFixed(6)),
    cells: owner,
    density,
    metrics: {
      movementHistory,
      massErrorHistory
    },
    artifacts: [asciiArtifact, metricsArtifact]
  };
}

function renderAscii(owner: Uint16Array, width: number, height: number, clusters: number): Buffer {
  const palette = Array.from({ length: clusters }, (_, idx) => String.fromCharCode(65 + (idx % 26)));
  const lines: string[] = [];
  for (let y = 0; y < height; y += 1) {
    let line = '';
    for (let x = 0; x < width; x += 1) {
      const idx = owner[y * width + x];
      line += palette[idx];
    }
    lines.push(line);
  }
  return Buffer.from(lines.join('\n'));
}

function rootMeanSquare(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, value) => acc + value * value, 0);
  return Math.sqrt(sum / values.length);
}
