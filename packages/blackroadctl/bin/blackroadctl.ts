#!/usr/bin/env node
import path from 'node:path';
import { Command } from 'commander';
import { runDeployCreate } from '../src/commands/deploy/create';
import { runDeployPromote } from '../src/commands/deploy/promote';
import { runOpsStatus } from '../src/commands/ops/status';
import { runOpsIncidents } from '../src/commands/ops/incidents';
import { runObsTail } from '../src/commands/obs/tail';
import { runObsCorrelate } from '../src/commands/obs/correlate';
import { configureTelemetry } from '../src/lib/telemetry';
import { runEconomySimulate } from '../src/commands/economy/simulate';
import { runEconomyEvidence } from '../src/commands/economy/evidence';
import { runEconomyGraph } from '../src/commands/economy/graph';
import { runSinkhornCli } from '../src/commands/ot/sb-run';
import { runSinkhornFrames } from '../src/commands/ot/sb-frames';

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

const ot = new Command('ot').description('Optimal transport workflows');

ot
  .command('sb-run')
  .description('Run a Sinkhorn Schrödinger Bridge solve and export artifacts')
  .requiredOption('--mu <file>', 'Source distribution JSON file')
  .requiredOption('--nu <file>', 'Target distribution JSON file')
  .requiredOption('--eps <value>', 'Entropic epsilon', parseFloat)
  .option('--iters <n>', 'Maximum iterations', (value) => parseInt(value, 10), 500)
  .option('--tol <value>', 'Tolerance for marginal error', parseFloat, 1e-3)
  .option('--cost <type>', 'Cost metric (l2|cosine|tv_l1)', 'l2')
  .option('--out <dir>', 'Artifact output directory', path.resolve(process.cwd(), 'artifacts/sb/cli'))
  .action(async (options) => {
    const telemetry = configureTelemetry('ot.sb-run');
    await runSinkhornCli({
      muPath: options.mu,
      nuPath: options.nu,
      epsilon: options.eps,
      iters: options.iters,
      tol: options.tol,
      cost: options.cost,
      outDir: options.out,
      telemetry
    });
  });

ot
  .command('sb-frames')
  .description('Generate additional interpolation frames for an SB run directory')
  .requiredOption('--job <dir>', 'Job directory created by sb-run')
  .requiredOption('--t <list>', 'Comma separated interpolation times (0-1)')
  .action(async (options) => {
    const telemetry = configureTelemetry('ot.sb-frames');
    const times = (options.t as string).split(',').map((value) => parseFloat(value.trim()));
    await runSinkhornFrames({ jobPath: options.job, times, telemetry });
  });

program.addCommand(ot);
const obs = new Command('obs').description('Observability mesh commands');

obs
  .command('tail')
  .description('Stream mesh events via SSE')
  .option('--filter <json>', 'JSON encoded EventFilter payload')
  .option('--limit <n>', 'Maximum events to print', (value) => parseInt(value, 10))
  .action(async (options) => {
    const telemetry = configureTelemetry('obs.tail');
    await runObsTail({ filter: options.filter, limit: options.limit, telemetry });
  });

obs
  .command('correlate')
  .description('Query correlated timelines for a key')
  .requiredOption('--key <value>', 'Correlation key value')
  .requiredOption('--keyType <type>', 'Correlation key type (traceId|releaseId|assetId|simId)')
  .action(async (options) => {
    const telemetry = configureTelemetry('obs.correlate');
    await runObsCorrelate({ key: options.key, keyType: options.keyType, telemetry });
  });

program.addCommand(obs);

program.parseAsync(process.argv).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
