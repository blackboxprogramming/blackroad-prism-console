import { mkdirSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import type { TelemetryHandle } from '../../lib/telemetry';
import { endTelemetry } from '../../lib/telemetry';
import {
  loadSolveConfig,
  computePdeSolution,
  computeMdpSolution,
  nearestFromGrid,
  nearestFromStates,
  runRolloutSimulation
} from './hjb-shared';

interface HjbRolloutOptions {
  configPath: string;
  start?: string;
  dt?: number;
  steps?: number;
  out?: string;
  telemetry: TelemetryHandle;
}

function parseStart(start: string | undefined, fallback: number[]): number[] {
  if (!start) {
    return fallback;
  }
  return start.split(',').map((value) => parseFloat(value.trim()));
}

export async function runHjbRollout(options: HjbRolloutOptions) {
  const config = loadSolveConfig(options.configPath);
  const outputDir = resolve(options.out ?? config.rollout?.out ?? 'artifacts/hjb');
  mkdirSync(outputDir, { recursive: true });

  try {
    if (config.mode === 'pde') {
      if (!config.pde) {
        throw new Error('Missing pde section in config');
      }
      const { grid, dynamics, cost, result, policy } = computePdeSolution(config.pde);
      const start = parseStart(options.start, config.rollout?.start ?? new Array(grid.spec.shape.length).fill(0));
      const steps = options.steps ?? config.rollout?.steps ?? 600;
      const dt = options.dt ?? config.rollout?.dt ?? 0.05;
      const rollout = runRolloutSimulation(
        dynamics,
        cost,
        (state) => policy[nearestFromGrid(grid, state)].slice(),
        start,
        steps,
        dt
      );
      const rolloutPath = join(outputDir, 'rollout.webm');
      writeFileSync(rolloutPath, JSON.stringify(rollout, null, 2));
      console.log(`[hjb] rollout generated ${rollout.samples.length} samples (cost ${rollout.totalCost?.toFixed(4) ?? 'n/a'})`);
      console.log(`[hjb] saved to ${rolloutPath}`);
    } else {
      if (!config.mdp) {
        throw new Error('Missing mdp section in config');
      }
      const mdp = computeMdpSolution(config.mdp);
      const start = parseStart(options.start, config.rollout?.start ?? mdp.states[0]);
      const steps = options.steps ?? config.rollout?.steps ?? 600;
      const dt = options.dt ?? config.rollout?.dt ?? config.mdp.dt;
      const rollout = runRolloutSimulation(
        mdp.dynamics,
        mdp.cost,
        (state) => {
          const index = nearestFromStates(mdp.states, state);
          return mdp.greedy.actions[index].slice();
        },
        start,
        steps,
        dt
      );
      const rolloutPath = join(outputDir, 'rollout.webm');
      writeFileSync(rolloutPath, JSON.stringify(rollout, null, 2));
      console.log(`[hjb] rollout generated ${rollout.samples.length} samples (cost ${rollout.totalCost?.toFixed(4) ?? 'n/a'})`);
      console.log(`[hjb] saved to ${rolloutPath}`);
    }
  } finally {
    endTelemetry(options.telemetry);
  }
}
