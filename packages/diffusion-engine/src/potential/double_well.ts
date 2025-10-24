export interface PotentialResult {
  value: number;
  grad: [number, number];
}

export function doubleWellPotential(x: number, y: number): PotentialResult {
  const value = 0.25 * (x * x - 1) * (x * x - 1) + 0.5 * y * y;
  const gradX = x * (x * x - 1);
  const gradY = y;
  return { value, grad: [gradX, gradY] };
}
