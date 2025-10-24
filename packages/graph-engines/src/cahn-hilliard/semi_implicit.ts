import { DensityField, PhaseFieldState } from '../types';
import { cloneField, laplacian, mean } from './grid';
import { writeBinaryArtifact, writeTextArtifact } from '../io/artifacts';

export interface CahnHilliardOptions {
  epsilon: number;
  dt: number;
  steps: number;
  mobility?: number;
  artifactDir?: string;
}

export function runCahnHilliard(initial: DensityField, options: CahnHilliardOptions): PhaseFieldState {
  const mobility = options.mobility ?? 1;
  const current = cloneField(initial);
  const frames: DensityField[] = [cloneField(current)];
  const residuals: number[] = [];
  for (let step = 0; step < options.steps; step += 1) {
    const chemicalPotential = computeChemicalPotential(current, options.epsilon);
    const divergence = applyLaplacian(chemicalPotential, options.dt * mobility);
    for (let i = 0; i < current.values.length; i += 1) {
      current.values[i] += divergence.values[i];
    }
    const deviation = Math.abs(mean(current) - mean(initial));
    residuals.push(Number(deviation.toFixed(8)));
    if ((step + 1) % Math.max(1, Math.floor(options.steps / 10)) === 0) {
      frames.push(cloneField(current));
    }
  }
  const summaryArtifact = writeTextArtifact(
    'cahn_hilliard_residuals.json',
    JSON.stringify({ residuals }, null, 2),
    'Mass conservation residuals over time',
    'json',
    { baseDir: options.artifactDir }
  );
  const frameArtifact = writeBinaryArtifact(
    'cahn_hilliard_frames.webm',
    renderAsciiVideo(frames),
    'ASCII video of phase evolution',
    'webm',
    { baseDir: options.artifactDir }
  );
  return {
    grid: current,
    frames,
    residuals,
    artifacts: [summaryArtifact, frameArtifact]
  };
}

function computeChemicalPotential(field: DensityField, epsilon: number): DensityField {
  const potential = cloneField(field);
  for (let y = 0; y < field.height; y += 1) {
    for (let x = 0; x < field.width; x += 1) {
      const idx = y * field.width + x;
      const lap = laplacian(field, x, y);
      const u = field.values[idx];
      potential.values[idx] = -epsilon * epsilon * lap + doubleWellPrime(u);
    }
  }
  return potential;
}

function doubleWellPrime(u: number): number {
  return u * (u * u - 1);
}

function applyLaplacian(field: DensityField, scale: number): DensityField {
  const result = cloneField(field);
  for (let y = 0; y < field.height; y += 1) {
    for (let x = 0; x < field.width; x += 1) {
      const idx = y * field.width + x;
      const lap = laplacian(field, x, y);
      result.values[idx] = scale * lap;
    }
  }
  return result;
}

function renderAsciiVideo(frames: DensityField[]): Buffer {
  const normalized = frames.map((frame) => normalize(frame));
  const palette = ' .:-=+*#%@';
  const lines: string[] = [];
  normalized.forEach((frame, index) => {
    lines.push(`frame ${index}`);
    for (let y = 0; y < frame.height; y += 1) {
      let row = '';
      for (let x = 0; x < frame.width; x += 1) {
        const value = frame.values[y * frame.width + x];
        const idx = Math.min(palette.length - 1, Math.max(0, Math.floor(value * (palette.length - 1))));
        row += palette[idx];
      }
      lines.push(row);
    }
  });
  return Buffer.from(lines.join('\n'));
}

function normalize(field: DensityField): DensityField {
  const min = Math.min(...field.values);
  const max = Math.max(...field.values);
  const range = max - min || 1;
  return {
    width: field.width,
    height: field.height,
    values: field.values.map((value) => (value - min) / range)
  };
}
