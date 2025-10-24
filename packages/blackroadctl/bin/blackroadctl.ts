#!/usr/bin/env node
import { Command } from 'commander';
import { runDeployCreate } from '../src/commands/deploy/create';
import { runDeployPromote } from '../src/commands/deploy/promote';
import { runOpsStatus } from '../src/commands/ops/status';
import { runOpsIncidents } from '../src/commands/ops/incidents';
import { runObsTail } from '../src/commands/obs/tail';
import { runObsCorrelate } from '../src/commands/obs/correlate';
import { configureTelemetry } from '../src/lib/telemetry';

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
