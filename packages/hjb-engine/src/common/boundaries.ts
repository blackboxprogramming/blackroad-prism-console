export function clamp(value: number, min: number, max: number, mode: 'clamp' | 'wrap', period: number): number {
  if (mode === 'wrap') {
    const range = max - min + 1;
    let adjusted = value - min;
    adjusted = ((adjusted % range) + range) % range;
    return min + adjusted;
  }
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function dirichlet(value: Float64Array, index: number, boundaryValue: number) {
  value[index] = boundaryValue;
}

export function neumann(value: Float64Array, interiorIndex: number, neighborIndex: number) {
  value[neighborIndex] = value[interiorIndex];
}
