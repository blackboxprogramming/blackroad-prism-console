import { EvidenceContext } from '../types';

function formatBreaches(violations: EvidenceContext['violations']): string {
  if (violations.length === 0) {
    return '- ✅ All invariants satisfied';
  }
  return violations.map((violation) => `- ❌ ${violation.rule} (month ${violation.monthIndex}): ${violation.message}`).join('\n');
}

export function buildEvidenceReport(context: EvidenceContext): string {
  const { simulationId, input, result, violations } = context;
  const lastPoint = result.points[result.points.length - 1];
  const firstPoint = result.points[0];

  const lines = [
    '# Tokenomics Evidence Report',
    '',
    `- Simulation ID: ${simulationId}`,
    `- Model version: ${input.modelVersion}`,
    `- Scenario: ${input.scenario.kind}`,
    `- Seed: ${input.seed}`,
    '',
    '## Summary',
    `- Horizon: ${input.scenario.horizonMonths} months starting ${firstPoint.date}`,
    `- Final supply: ${lastPoint.totalSupply.toFixed(2)}`,
    `- Max inflation: ${result.summary.maxInflation.toFixed(4)}%`,
    '',
    '## Invariant Checks',
    formatBreaches(violations),
    '',
    '## Claims',
    `- Circulating supply on ${lastPoint.date}: ${lastPoint.circulating.toFixed(2)}`,
    `- Unlock caps respected: ${violations.length === 0 ? 'yes' : 'no (see above)'}`,
    `- Inflation capped at ${result.summary.maxInflation.toFixed(4)}% over the horizon`
  ];

  return lines.join('\n');
}
