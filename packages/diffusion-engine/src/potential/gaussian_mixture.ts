export interface GaussianComponent {
  weight: number;
  mean: [number, number];
  sigma: number;
}

export interface GaussianMixtureConfig {
  components: GaussianComponent[];
}

export function gaussianMixturePotential(
  x: number,
  y: number,
  cfg?: GaussianMixtureConfig
): { value: number; grad: [number, number] } {
  const components = cfg?.components ?? [
    { weight: 0.5, mean: [-1, 0], sigma: 0.6 },
    { weight: 0.5, mean: [1, 0], sigma: 0.6 }
  ];
  let numerator = 0;
  let gradX = 0;
  let gradY = 0;
  for (const comp of components) {
    const dx = x - comp.mean[0];
    const dy = y - comp.mean[1];
    const sigma2 = comp.sigma * comp.sigma;
    const exponent = Math.exp(-(dx * dx + dy * dy) / (2 * sigma2));
    const contrib = comp.weight * exponent;
    numerator += contrib;
    gradX += contrib * (dx / sigma2);
    gradY += contrib * (dy / sigma2);
  }
  const value = -Math.log(Math.max(numerator, 1e-12));
  const inv = numerator > 1e-12 ? 1 / numerator : 0;
  return { value, grad: [gradX * inv, gradY * inv] };
}
