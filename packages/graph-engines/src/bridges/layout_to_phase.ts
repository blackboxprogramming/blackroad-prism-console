import { PhaseField } from '../types';

export interface LayoutBridgeInput {
  width: number;
  height: number;
  assignments: number[];
  clusters: number;
}

export function layoutToPhase(input: LayoutBridgeInput): PhaseField {
  const values = new Array(input.assignments.length).fill(0);
  for (let i = 0; i < input.assignments.length; i += 1) {
    const label = input.assignments[i];
    const normalized = (label / Math.max(1, input.clusters - 1)) * 2 - 1;
    values[i] = normalized;
  }
  return { width: input.width, height: input.height, values };
}
