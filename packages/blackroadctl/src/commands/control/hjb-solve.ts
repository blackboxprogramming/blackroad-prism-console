import { mkdirSync } from 'fs';
import { resolve, join } from 'path';
import type { TelemetryHandle } from '../../lib/telemetry';
import { endTelemetry } from '../../lib/telemetry';
import {
  computePdeSolution,
  computeMdpSolution,
  loadSolveConfig,
  nearestFromGrid,
  nearestFromStates,
  runRolloutSimulation
} from './hjb-shared';
import { exportArtifacts } from '@blackroad/hjb-engine';

interface HjbSolveOptions {
  configPath: string;
  telemetry: TelemetryHandle;
}

export async function runHjbSolve(options: HjbSolveOptions) {
  const config = loadSolveConfig(options.configPath);
  const outputDir = resolve(config.outputDir ?? 'artifacts/hjb');
  mkdirSync(outputDir, { recursive: true });

  try {
    if (config.mode === 'pde') {
      if (!config.pde) {
        throw new Error('Missing pde section in config');
      }
      const { grid, dynamics, cost, result, policy } = computePdeSolution(config.pde);
      const rollout = config.rollout
        ? runRolloutSimulation(
            dynamics,
            cost,
            (state) => policy[nearestFromGrid(grid, state)].slice(),
            config.rollout.start,
            config.rollout.steps ?? 600,
            config.rollout.dt ?? 0.05
          )
        : undefined;
      exportArtifacts({
        value: result.value,
        policy,
        grid,
        quiverPath: join(outputDir, 'quiver.png'),
        valuePath: join(outputDir, 'V.csv'),
        policyPath: join(outputDir, 'policy.csv'),
        rolloutPath: join(outputDir, 'rollout.webm'),
        rollout
      });
      console.log(`[hjb] PDE solve completed in ${result.iterations} iterations (residual ${result.residual.toFixed(4)})`);
      if (rollout) {
        console.log(`[hjb] rollout cost ${rollout.totalCost?.toFixed(4) ?? 'n/a'}`);
      }
    } else {
      if (!config.mdp) {
        throw new Error('Missing mdp section in config');
      }
      const { grid, dynamics, cost, states, actions, result, greedy } = computeMdpSolution(config.mdp);
      const valueArray = Float64Array.from(result.value);
      const rollout = config.rollout
        ? runRolloutSimulation(
            dynamics,
            cost,
            (state) => {
              const index = nearestFromStates(states, state);
              return greedy.actions[index].slice();
            },
            config.rollout.start,
            config.rollout.steps ?? 600,
            config.rollout.dt ?? config.mdp.dt
          )
        : undefined;
      exportArtifacts({
        value: valueArray,
        policy: greedy.actions,
        grid,
        quiverPath: join(outputDir, 'quiver.png'),
        valuePath: join(outputDir, 'V.csv'),
        policyPath: join(outputDir, 'policy.csv'),
        rolloutPath: join(outputDir, 'rollout.webm'),
        rollout
      });
      console.log(`[hjb] MDP value iteration completed in ${result.iterations} iterations (residual ${result.residual.toFixed(6)})`);
      console.log(`[hjb] policy ties across ${greedy.ties} states`);
      if (rollout) {
        console.log(`[hjb] rollout cost ${rollout.totalCost?.toFixed(4) ?? 'n/a'}`);
      }
    }
  } finally {
    endTelemetry(options.telemetry);
  }
}
