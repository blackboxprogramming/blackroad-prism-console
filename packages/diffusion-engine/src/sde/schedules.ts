export type BetaSchedule = (t: number, step: number) => number;

export function constantBeta(beta: number): BetaSchedule {
  return () => beta;
}

export function linearBeta(start: number, end: number, totalSteps: number): BetaSchedule {
  const denom = Math.max(totalSteps - 1, 1);
  return (_, step) => start + ((end - start) * step) / denom;
}

export function cosineBeta(beta: number, totalSteps: number): BetaSchedule {
  return (_, step) => {
    const tau = step / Math.max(totalSteps - 1, 1);
    return beta * (0.5 - 0.5 * Math.cos(Math.PI * tau));
  };
}

export function parseBetaSchedule(spec: string, totalSteps: number): BetaSchedule {
  if (!spec) {
    return constantBeta(0.02);
  }
  if (spec.startsWith('const:')) {
    const value = parseFloat(spec.split(':')[1] ?? '0.02');
    return constantBeta(value);
  }
  if (spec.startsWith('linear:')) {
    const [, rest] = spec.split(':');
    const [startStr, endStr] = (rest ?? '0.01->0.05').split('->');
    return linearBeta(parseFloat(startStr), parseFloat(endStr), totalSteps);
  }
  if (spec.startsWith('cosine:')) {
    const value = parseFloat(spec.split(':')[1] ?? '0.02');
    return cosineBeta(value, totalSteps);
  }
  return constantBeta(0.02);
}
