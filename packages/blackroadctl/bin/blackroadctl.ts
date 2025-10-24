#!/usr/bin/env node
import { Command } from 'commander';
import { runDeployCreate } from '../src/commands/deploy/create';
import { runDeployPromote } from '../src/commands/deploy/promote';
import { runOpsStatus } from '../src/commands/ops/status';
import { runOpsIncidents } from '../src/commands/ops/incidents';
import { configureTelemetry } from '../src/lib/telemetry';
import { runEconomySimulate } from '../src/commands/economy/simulate';
import { runEconomyEvidence } from '../src/commands/economy/evidence';
import { runEconomyGraph } from '../src/commands/economy/graph';
import { runOtSolve } from '../src/commands/ot/solve';
import { runOtInterpolate } from '../src/commands/ot/interpolate';

const program = new Command();
program
  .name('blackroadctl')
  .description('Unified control plane CLI for deploys, releases, and operations')
  .version('0.1.0');

const deploy = new Command('deploy').description('Deploy workflows');

deploy
  .command('create')
  .description('Create a release for a service in an environment')
  .requiredOption('--service <id>', 'Service identifier')
  .requiredOption('--env <id>', 'Environment identifier')
  .requiredOption('--sha <gitsha>', 'Git SHA to deploy')
  .option('--dry-run', 'Plan only; do not apply changes')
  .action(async (options) => {
    const telemetry = configureTelemetry('deploy.create');
    await runDeployCreate({
      serviceId: options.service,
      envId: options.env,
      sha: options.sha,
      dryRun: Boolean(options.dryRun),
      telemetry
    });
  });

deploy
  .command('promote')
  .description('Promote an existing release to another environment')
  .requiredOption('--release <id>', 'Release identifier')
  .requiredOption('--to <env>', 'Target environment identifier')
  .action(async (options) => {
    const telemetry = configureTelemetry('deploy.promote');
    await runDeployPromote({
      releaseId: options.release,
      toEnvId: options.to,
      telemetry
    });
  });

program.addCommand(deploy);

const ops = new Command('ops').description('Operations workflows');

ops
  .command('status')
  .description('Show service status and recent releases')
  .requiredOption('--service <id>', 'Service identifier')
  .action(async (options) => {
    const telemetry = configureTelemetry('ops.status');
    await runOpsStatus({ serviceId: options.service, telemetry });
  });

ops
  .command('incidents')
  .description('List recent incidents for a service')
  .requiredOption('--service <id>', 'Service identifier')
  .option('--limit <n>', 'Number of incidents to show', (value) => parseInt(value, 10))
  .action(async (options) => {
    const telemetry = configureTelemetry('ops.incidents');
    await runOpsIncidents({ serviceId: options.service, limit: options.limit, telemetry });
  });

program.addCommand(ops);

const economy = new Command('economy').description('Tokenomics simulation workflows');

economy
  .command('simulate')
  .description('Run a tokenomics simulation and collect artifacts')
  .requiredOption('--scenario <file>', 'Scenario JSON file')
  .option('--seed <n>', 'Deterministic seed', (value) => parseInt(value, 10))
  .option('--out <dir>', 'Directory to copy artifacts into')
  .action(async (options) => {
    const telemetry = configureTelemetry('economy.simulate');
    await runEconomySimulate({
      scenarioPath: options.scenario,
      seed: options.seed,
      out: options.out,
      telemetry
    });
  });

economy
  .command('evidence')
  .description('Inspect evidence for a simulation run')
  .requiredOption('--id <simulationId>', 'Simulation identifier')
  .option('--open', 'Print evidence markdown to stdout')
  .action(async (options) => {
    const telemetry = configureTelemetry('economy.evidence');
    await runEconomyEvidence({ id: options.id, open: Boolean(options.open), telemetry });
  });

economy
  .command('graph')
  .description('Render a sparkline for a simulation metric')
  .requiredOption('--id <simulationId>', 'Simulation identifier')
  .option('--metric <metric>', 'Metric to chart', 'circulating')
  .action(async (options) => {
    const telemetry = configureTelemetry('economy.graph');
    const metric = options.metric as 'circulating' | 'totalSupply' | 'inflation';
    await runEconomyGraph({ id: options.id, metric, telemetry });
  });

program.addCommand(economy);

const ot = new Command('ot').description('Optimal transport solvers');

ot
  .command('solve')
  .description('Run an OT solver and write artifacts to disk')
  .requiredOption('--kind <kind>', 'Solver kind (semidiscrete|dynamic)')
  .requiredOption('--source <file>', 'Source density JSON')
  .option('--target <file>', 'Target density or sites JSON')
  .option('--steps <n>', 'Time steps for dynamic solver', (value) => parseInt(value, 10))
  .option('--out <dir>', 'Artifact output directory')
  .action(async (options) => {
    const kind = options.kind as 'semidiscrete' | 'dynamic';
    if (kind !== 'semidiscrete' && kind !== 'dynamic') {
      throw new Error('kind must be semidiscrete or dynamic');
    }
    await runOtSolve({
      kind,
      source: options.source,
      target: options.target,
      steps: options.steps,
      out: options.out,
    });
  });

ot
  .command('interpolate')
  .description('Sample a displacement frame from a dynamic job output')
  .requiredOption('--job <file>', 'Path to job.json produced by ot solve')
  .requiredOption('--t <value>', 'Time in [0,1]', (value) => parseFloat(value))
  .option('--out <dir>', 'Output directory (defaults to job directory)')
  .action(async (options) => {
    await runOtInterpolate({
      job: options.job,
      t: options.t,
      out: options.out,
    });
  });

program.addCommand(ot);

program.parseAsync(process.argv).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
