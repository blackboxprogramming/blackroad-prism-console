export type ScenarioKind = 'linear' | 'halving' | 'unlocks';

export interface BaseScenario {
  kind: ScenarioKind;
  startDate: string; // ISO date string, first day of the month
  horizonMonths: number;
}

export interface LinearScenario extends BaseScenario {
  kind: 'linear';
  params: {
    initialSupply: number;
    emissionPerMonth: number;
    burnPerMonth?: number;
    maxSupply: number;
  };
}

export interface HalvingScenario extends BaseScenario {
  kind: 'halving';
  params: {
    initialSupply: number;
    baseEmission: number;
    halvingPeriodMonths: number;
    maxSupply: number;
  };
}

export interface UnlockSchedule {
  cliffMonths: number;
  vestingMonths: number;
  total: number;
}

export interface UnlockScenario extends BaseScenario {
  kind: 'unlocks';
  params: {
    initialSupply: number;
    allocations: {
      team: number;
      treasury: number;
      community: number;
    };
    schedules: {
      team: UnlockSchedule;
      treasury: UnlockSchedule;
      community: UnlockSchedule;
    };
  };
}

export type Scenario = LinearScenario | HalvingScenario | UnlockScenario;

export interface LockedBreakdown {
  team: number;
  treasury: number;
  community: number;
}

export interface LedgerState {
  monthIndex: number;
  date: string;
  totalSupply: number;
  circulating: number;
  locked: LockedBreakdown;
  inflation: number;
  minted: number;
  burned: number;
  unlocked: LockedBreakdown;
}

export interface SimulationInput {
  seed: number;
  scenario: Scenario;
  modelVersion: string;
}

export interface InvariantViolation {
  rule: string;
  message: string;
  monthIndex: number;
}

export interface SimulationRunResult {
  points: LedgerState[];
  summary: {
    finalSupply: number;
    maxInflation: number;
    breaches: string[];
  };
  violations: InvariantViolation[];
}

export interface EvidenceContext {
  simulationId: string;
  input: SimulationInput;
  result: SimulationRunResult;
  violations: InvariantViolation[];
}
