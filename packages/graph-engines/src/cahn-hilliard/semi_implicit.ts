import { CahnHilliardOptions, CahnHilliardResult, PhaseField } from '../types';
import { addScaled, clonePhaseField, laplacian, subtractMean } from './grid';

function derivativeDoubleWell(u: number): number {
  return u * (u * u - 1);
}

export interface CahnInitialCondition {
  field: PhaseField;
}

export function runCahnHilliard(
  initial: CahnInitialCondition,
  options: CahnHilliardOptions
): CahnHilliardResult {
  const field = clonePhaseField(initial.field);
  const frames: PhaseField[] = [clonePhaseField(field)];
  const residuals: number[] = [];
  const recordEvery = options.recordEvery ?? Math.max(1, Math.floor(options.steps / 10));
  let totalMass = field.values.reduce((sum, value) => sum + value, 0);

  for (let step = 1; step <= options.steps; step += 1) {
    const lap = laplacian(field);
    const mu = field.values.map((value, idx) => -options.epsilon * options.epsilon * lap[idx] + derivativeDoubleWell(value));
    const muField: PhaseField = { width: field.width, height: field.height, values: mu };
    const lapMu = laplacian(muField);
    const updated = addScaled(field.values, lapMu, options.dt);
    subtractMean(updated);
    const newMass = updated.reduce((sum, value) => sum + value, 0);
    const correction = (totalMass - newMass) / updated.length;
    for (let i = 0; i < updated.length; i += 1) {
      updated[i] += correction;
    }
    const residual = Math.sqrt(lapMu.reduce((sum, value) => sum + value * value, 0) / lapMu.length);
    residuals.push(residual);
    field.values = updated;
    totalMass = updated.reduce((sum, value) => sum + value, 0);
    if (step % recordEvery === 0 || step === options.steps) {
      frames.push(clonePhaseField(field));
    }
  }

  return { frames, residuals, mass: totalMass };
}
