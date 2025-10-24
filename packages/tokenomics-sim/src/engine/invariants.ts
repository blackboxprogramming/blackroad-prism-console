import { InvariantViolation, LedgerState, Scenario } from '../types';

const EPSILON = 1e-6;

function isClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= EPSILON;
}

export function checkInvariants(scenario: Scenario, series: LedgerState[]): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  series.forEach((point) => {
    if (point.totalSupply < -EPSILON || point.circulating < -EPSILON) {
      violations.push({
        rule: 'supply_non_negative',
        message: `Negative supply detected in month ${point.monthIndex}`,
        monthIndex: point.monthIndex
      });
    }
    (['team', 'treasury', 'community'] as const).forEach((role) => {
      if (point.locked[role] < -EPSILON) {
        violations.push({
          rule: 'supply_non_negative',
          message: `Negative locked balance for ${role} at month ${point.monthIndex}`,
          monthIndex: point.monthIndex
        });
      }
    });

    const lockedSum = point.locked.team + point.locked.treasury + point.locked.community;
    if (!isClose(lockedSum + point.circulating, point.totalSupply)) {
      violations.push({
        rule: 'supply_conservation',
        message: `Supply conservation mismatch at month ${point.monthIndex}`,
        monthIndex: point.monthIndex
      });
    }
  });

  if (scenario.kind === 'unlocks') {
    const allocationTotals = scenario.params.allocations;
    const cumulative = { team: 0, treasury: 0, community: 0 };
    series.forEach((point) => {
      cumulative.team += point.unlocked.team;
      cumulative.treasury += point.unlocked.treasury;
      cumulative.community += point.unlocked.community;
      (['team', 'treasury', 'community'] as const).forEach((role) => {
        if (cumulative[role] - allocationTotals[role] > EPSILON) {
          violations.push({
            rule: 'unlock_caps',
            message: `${role} unlock cap exceeded at month ${point.monthIndex}`,
            monthIndex: point.monthIndex
          });
        }
      });
    });
  }

  if (scenario.kind === 'halving') {
    const { baseEmission, halvingPeriodMonths } = scenario.params;
    series.forEach((point) => {
      if (point.monthIndex === 0) {
        return;
      }
      const epochs = Math.floor((point.monthIndex - 1) / Math.max(halvingPeriodMonths, 1));
      const expected = baseEmission / Math.pow(2, epochs);
      if (point.minted > 0 && Math.abs(point.minted - expected) > 1e-3) {
        violations.push({
          rule: 'halving_curve',
          message: `Minted ${point.minted.toFixed(4)} but expected ${expected.toFixed(4)} at month ${point.monthIndex}`,
          monthIndex: point.monthIndex
        });
      }
    });
  }

  return violations;
}
