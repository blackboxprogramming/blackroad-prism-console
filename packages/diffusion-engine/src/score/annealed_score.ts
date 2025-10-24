export interface AnnealedScoreConfig {
  startSigma?: number;
  endSigma?: number;
}

export function createAnnealedScore(
  cfg: AnnealedScoreConfig = {}
): (x: [number, number], t: number, T: number) => [number, number] {
  const startSigma = cfg.startSigma ?? 1.5;
  const endSigma = cfg.endSigma ?? 0.3;
  return (x, t, T) => {
    const tau = T === 0 ? 0 : t / T;
    const sigma = startSigma * Math.pow(endSigma / startSigma, tau);
    const inv = 1 / (sigma * sigma);
    return [-x[0] * inv, -x[1] * inv];
  };
}
