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
