import { readFileSync } from 'fs';
import { join } from 'path';
import { runSimulation, timeseriesToCsv } from '../src';
import { Scenario } from '../src/types';

const MODEL_VERSION = '2024.10.0';

function loadGolden(name: string): string {
  return readFileSync(join(__dirname, 'golden', name), 'utf8').trim();
}

describe('tokenomics simulation engine', () => {
  it('produces deterministic output for linear emissions', () => {
    const scenario: Scenario = {
      kind: 'linear',
      startDate: '2025-01-01',
      horizonMonths: 6,
      params: {
        initialSupply: 1_000_000,
        emissionPerMonth: 25_000,
        maxSupply: 1_200_000,
        burnPerMonth: 2_500
      }
    };

    const result = runSimulation({ seed: 7, scenario, modelVersion: MODEL_VERSION });
    expect(result.summary.finalSupply).toBeCloseTo(1_135_000);
    expect(result.violations).toHaveLength(0);

    const csv = timeseriesToCsv(result.points).trim();
    expect(csv).toEqual(loadGolden('linear.small.csv.golden'));
  });

  it('produces deterministic unlock schedule', () => {
    const scenario: Scenario = {
      kind: 'unlocks',
      startDate: '2025-01-01',
      horizonMonths: 6,
      params: {
        initialSupply: 3_000_000,
        allocations: {
          team: 1_200_000,
          treasury: 600_000,
          community: 400_000
        },
        schedules: {
          team: { cliffMonths: 2, vestingMonths: 6, total: 1_200_000 },
          treasury: { cliffMonths: 1, vestingMonths: 4, total: 600_000 },
          community: { cliffMonths: 0, vestingMonths: 3, total: 400_000 }
        }
      }
    };

    const result = runSimulation({ seed: 42, scenario, modelVersion: MODEL_VERSION });
    expect(result.violations).toHaveLength(0);
    const csv = timeseriesToCsv(result.points).trim();
    expect(csv).toEqual(loadGolden('unlocks.team.csv.golden'));
  });
});
