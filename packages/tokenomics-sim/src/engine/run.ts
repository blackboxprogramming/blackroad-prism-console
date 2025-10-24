import { applyHalvingEmission } from './models/halving';
import { applyLinearEmission } from './models/linear';
import { applyUnlockSchedule } from './models/unlocks';
import { DeterministicRng } from './rand';
import { checkInvariants } from './invariants';
import {
  LedgerState,
  Scenario,
  SimulationInput,
  SimulationRunResult,
  LockedBreakdown
} from '../types';

function monthToDate(startDate: Date, offset: number): string {
  const date = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function initialiseState(scenario: Scenario): LedgerState {
  const baseLocked: LockedBreakdown = { team: 0, treasury: 0, community: 0 };
  if (scenario.kind === 'unlocks') {
    baseLocked.team = scenario.params.allocations.team;
    baseLocked.treasury = scenario.params.allocations.treasury;
    baseLocked.community = scenario.params.allocations.community;
  }
  const circulating =
    scenario.kind === 'unlocks'
      ? Math.max(scenario.params.initialSupply - (baseLocked.team + baseLocked.treasury + baseLocked.community), 0)
      : scenario.params.initialSupply;
  return {
    monthIndex: 0,
    date: monthToDate(new Date(scenario.startDate), 0),
    totalSupply: scenario.params.initialSupply,
    circulating,
    locked: baseLocked,
    inflation: 0,
    minted: 0,
    burned: 0,
    unlocked: { team: 0, treasury: 0, community: 0 }
  };
}

function cloneState(state: LedgerState): LedgerState {
  return {
    monthIndex: state.monthIndex,
    date: state.date,
    totalSupply: state.totalSupply,
    circulating: state.circulating,
    locked: { ...state.locked },
    inflation: state.inflation,
    minted: state.minted,
    burned: state.burned,
    unlocked: { ...state.unlocked }
  };
}

export function runSimulation(input: SimulationInput): SimulationRunResult {
  const { scenario } = input;
  const startDate = new Date(scenario.startDate);
  if (Number.isNaN(startDate.getTime())) {
    throw new Error(`Invalid scenario start date: ${scenario.startDate}`);
  }
  const rng = new DeterministicRng(input.seed);
  const points: LedgerState[] = [];
  let current = initialiseState(scenario);
  points.push(cloneState(current));

  for (let month = 1; month <= scenario.horizonMonths; month += 1) {
    const previous = cloneState(current);
    current = cloneState(previous);
    current.monthIndex = month;
    current.date = monthToDate(startDate, month);

    let minted = 0;
    let burned = 0;
    let unlocked: LockedBreakdown = { team: 0, treasury: 0, community: 0 };

    if (scenario.kind === 'linear') {
      const result = applyLinearEmission(scenario, previous);
      minted = result.minted;
      burned = result.burned;
    } else if (scenario.kind === 'halving') {
      const result = applyHalvingEmission(scenario, previous);
      minted = result.minted;
      burned = result.burned;
    } else if (scenario.kind === 'unlocks') {
      const unlockResult = applyUnlockSchedule(scenario, previous);
      unlocked = unlockResult.unlocked;
      minted = 0;
      burned = 0;
    }

    current.minted = minted;
    current.burned = burned;
    current.unlocked = unlocked;

    current.totalSupply = Math.max(previous.totalSupply + minted - burned, 0);

    if (scenario.kind === 'unlocks') {
      current.locked = { ...previous.locked };
      (['team', 'treasury', 'community'] as const).forEach((role) => {
        current.locked[role] = Math.max(current.locked[role] - unlocked[role], 0);
      });
    } else {
      current.locked = { ...previous.locked };
    }

    current.circulating = Math.max(previous.circulating + minted - burned, 0);
    if (scenario.kind === 'unlocks') {
      const unlockedSum = unlocked.team + unlocked.treasury + unlocked.community;
      current.circulating = Math.max(current.circulating + unlockedSum, 0);
    }

    const base = previous.circulating > 0 ? previous.circulating : previous.totalSupply || 1;
    current.inflation = base > 0 ? (minted / base) * 100 : 0;

    points.push(cloneState(current));
    rng.next(); // advance RNG to make seed affect deterministic ordering even without randomness
  }

  const violations = checkInvariants(scenario, points);
  const summary = {
    finalSupply: points[points.length - 1].totalSupply,
    maxInflation: points.reduce((max, point) => Math.max(max, point.inflation), 0),
    breaches: violations.map((violation) => `${violation.rule}:${violation.monthIndex}`)
  };

  return { points, summary, violations };
}
