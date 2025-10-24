#!/usr/bin/env node
import { Command } from 'commander';
import { runDeployCreate } from '../src/commands/deploy/create';
import { runDeployPromote } from '../src/commands/deploy/promote';
import { runOpsStatus } from '../src/commands/ops/status';
import { runOpsIncidents } from '../src/commands/ops/incidents';
import { runCaptionCreate } from '../src/commands/media/caption-create';
import { runCaptionStatus } from '../src/commands/media/caption-status';
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

const media = new Command('media').description('Media workflows');

media
  .command('caption-create')
  .description('Create a caption job for an asset')
  .requiredOption('--asset <id>', 'Asset identifier')
  .requiredOption('--file <path_or_url>', 'Path or URL to media source')
  .option('--backend <name>', 'Transcription backend', 'local')
  .option('--lang <code>', 'Language code', 'en')
  .action(async (options) => {
    const telemetry = configureTelemetry('media.caption-create');
    await runCaptionCreate({
      assetId: options.asset,
      source: options.file,
      backend: options.backend,
      lang: options.lang,
      telemetry
    });
  });

media
  .command('caption-status')
  .description('Fetch the status of a caption job')
  .requiredOption('--job <id>', 'Caption job identifier')
  .option('--watch', 'Poll until the job completes')
  .option('--interval <ms>', 'Polling interval in milliseconds', (value) => parseInt(value, 10))
  .action(async (options) => {
    const telemetry = configureTelemetry('media.caption-status');
    await runCaptionStatus({
      jobId: options.job,
      watch: Boolean(options.watch),
      intervalMs: options.interval,
      telemetry
    });
  });

program.addCommand(media);

program.parseAsync(process.argv).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
