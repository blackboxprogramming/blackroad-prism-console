#!/usr/bin/env node
import path from 'node:path';
import { Command } from 'commander';
import { runDeployCreate } from '../src/commands/deploy/create';
import { runDeployPromote } from '../src/commands/deploy/promote';
import { runOpsStatus } from '../src/commands/ops/status';
import { runOpsIncidents } from '../src/commands/ops/incidents';
import { runObsTail } from '../src/commands/obs/tail';
import { runObsCorrelate } from '../src/commands/obs/correlate';
import { runCaptionCreate } from '../src/commands/media/caption-create';
import { runCaptionStatus } from '../src/commands/media/caption-status';
import { configureTelemetry } from '../src/lib/telemetry';
import { runEconomySimulate } from '../src/commands/economy/simulate';
import { runEconomyEvidence } from '../src/commands/economy/evidence';
import { runEconomyGraph } from '../src/commands/economy/graph';
import { runSinkhornCli } from '../src/commands/ot/sb-run';
import { runSinkhornFrames } from '../src/commands/ot/sb-frames';
import { runChatPost } from '../src/commands/chat/post';
import { runChatTail } from '../src/commands/chat/tail';
import { runGraphEmbed } from '../src/commands/graph/embed';
import { runGraphLayout } from '../src/commands/graph/layout';
import { runGraphPhase } from '../src/commands/graph/phase';
import { runGraphBridge } from '../src/commands/graph/bridge';
import { runOtSolve } from '../src/commands/ot/solve';
import { runOtInterpolate } from '../src/commands/ot/interpolate';
import { runHjbSolve } from '../src/commands/control/hjb-solve';
import { runHjbRollout } from '../src/commands/control/hjb-rollout';
import { runDiffusionRun } from '../src/commands/diffusion/run';
import { runDiffusionCompare } from '../src/commands/diffusion/compare';
import { runDiffusionExport } from '../src/commands/diffusion/export';
import { runGraphRicci } from '../src/commands/graph/ricci-run';
import { runGraphRicciLayout } from '../src/commands/graph/ricci-layout';

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

const graph = new Command('graph').description('Graph Labs workflows');

graph
  .command('embed')
  .description('Run spectral embedding on an edge list file')
  .requiredOption('--edge-list <file>', 'Edge list file (source target per line)')
  .option('--k <n>', 'Embedding dimension', (value) => parseInt(value, 10), 8)
  .option('--seed <n>', 'Deterministic seed', (value) => parseInt(value, 10), 7)
  .option('--out <dir>', 'Output directory', path.resolve(process.cwd(), 'artifacts/graph/embed'))
  .action(async (options) => {
    const telemetry = configureTelemetry('graph.embed');
    await runGraphEmbed({
      edgeList: options.edgeList,
      k: options.k,
      seed: options.seed,
      outDir: options.out,
      telemetry
    });
  });

graph
  .command('layout')
  .description('Run PowerLloyd layout on an embedding CSV')
  .requiredOption('--embedding <file>', 'Spectral embedding CSV path')
  .option('--sites <n>', 'Initial sites', (value) => parseInt(value, 10), 12)
  .option('--seed <n>', 'Deterministic seed', (value) => parseInt(value, 10), 11)
  .option('--out <dir>', 'Output directory', path.resolve(process.cwd(), 'artifacts/graph/layout'))
  .action(async (options) => {
    const telemetry = configureTelemetry('graph.layout');
    await runGraphLayout({
      seed: options.seed,
      outDir: options.out,
      initSites: options.sites,
      embeddingPath: options.embedding,
      telemetry
    });
  });

graph
  .command('phase')
  .description('Run Cahn–Hilliard phase evolution on an initial field JSON')
  .requiredOption('--init <file>', 'Initial phase field JSON')
  .option('--steps <n>', 'Number of steps', (value) => parseInt(value, 10), 120)
  .option('--out <dir>', 'Output directory', path.resolve(process.cwd(), 'artifacts/graph/phase'))
  .action(async (options) => {
    const telemetry = configureTelemetry('graph.phase');
    await runGraphPhase({
      seed: 7,
      outDir: options.out,
      initPath: options.init,
      steps: options.steps,
      telemetry
    });
  });

graph
  .command('bridge')
  .description('Bridge spectral embedding and layout outputs into downstream assets')
  .requiredOption('--embedding <file>', 'Spectral embedding CSV')
  .requiredOption('--layout <file>', 'Layout JSON with assignments')
  .option('--out <dir>', 'Output directory', path.resolve(process.cwd(), 'artifacts/graph/bridge'))
  .action(async (options) => {
    const telemetry = configureTelemetry('graph.bridge');
    await runGraphBridge({
      spectralEmbedding: options.embedding,
      layoutAssignments: options.layout,
      outDir: options.out,
      telemetry
    });
  });

graph
  .command('ricci-run')
  .description('Run curvature-aware Ricci flow on an edge list file')
  .requiredOption('--edge-list <file>', 'Edge list file (source target [weight])')
  .option('--curvature <type>', 'Curvature engine (forman|ollivier)', 'forman')
  .option('--tau <value>', 'Step size', parseFloat, 0.05)
  .option('--iters <n>', 'Iterations', (value) => parseInt(value, 10), 20)
  .option('--epsilon <value>', 'Minimum weight floor', parseFloat, 1e-4)
  .option('--target <value>', 'Target curvature (kappa*)', parseFloat)
  .option('--layout <type>', 'Layout engine (mds|spectral|powerlloyd)', 'mds')
  .option('--out <dir>', 'Output directory', path.resolve(process.cwd(), 'artifacts/graph/ricci'))
  .action(async (options) => {
    const telemetry = configureTelemetry('graph.ricci-run');
    await runGraphRicci({
      edgeList: options['edgeList'] ?? options.edgeList,
      curvature: options.curvature,
      tau: options.tau,
      iterations: options.iters,
      epsilon: options.epsilon,
      target: options.target,
      layout: options.layout,
      outDir: options.out,
      telemetry
    });
  });

graph
  .command('ricci-layout')
  .description('Re-embed a flowed Ricci graph using stored weights')
  .requiredOption('--edge-list <file>', 'Original edge list file')
  .requiredOption('--weights <file>', 'Weights CSV from ricci-run')
  .option('--layout <type>', 'Layout engine (mds|spectral|powerlloyd)', 'mds')
  .option('--out <dir>', 'Output directory', path.resolve(process.cwd(), 'artifacts/graph/ricci-layout'))
  .action(async (options) => {
    const telemetry = configureTelemetry('graph.ricci-layout');
    await runGraphRicciLayout({
      edgeList: options['edgeList'] ?? options.edgeList,
      weights: options.weights,
      layout: options.layout,
      outDir: options.out,
      telemetry
    });
  });

program.addCommand(graph);

const diffusion = new Command('diffusion').description('Diffusion Lab workflows');

diffusion
  .command('run')
  .description('Execute an SDE or Fokker–Planck simulation')
  .requiredOption('--mode <mode>', 'Mode to run (sde|fp)')
  .option('--potential <name>', 'Potential preset', 'double_well')
  .option('--score <name>', 'Score model name')
  .option('--beta <schedule>', 'Diffusion schedule', 'const:0.02')
  .option('--steps <n>', 'Number of steps', (value) => parseInt(value, 10), 200)
  .option('--dt <value>', 'Time step size', parseFloat, 0.01)
  .option('--particles <n>', 'Number of particles for SDE', (value) => parseInt(value, 10))
  .option('--grid <n>', 'Grid resolution (square)', (value) => parseInt(value, 10))
  .option('--boundary <type>', 'Boundary condition for FP', 'neumann')
  .option('--seed <n>', 'Deterministic seed', (value) => parseInt(value, 10), 7)
  .option('--out <dir>', 'Output directory for artifacts')
  .action(async (options) => {
    const mode = options.mode as 'sde' | 'fp';
    if (!['sde', 'fp'].includes(mode)) {
      throw new Error(`Unsupported diffusion mode ${options.mode}`);
    }
    const telemetry = configureTelemetry('diffusion.run');
    await runDiffusionRun({
      mode,
      potential: options.potential,
      score: options.score,
      beta: options.beta,
      steps: options.steps,
      dt: options.dt,
      particles: options.particles,
      grid: options.grid,
      boundary: options.boundary,
      seed: options.seed,
      outDir: options.out,
      telemetry
    });
  });

diffusion
  .command('compare')
  .description('Compute KL, MMD, and entropy metrics between jobs')
  .requiredOption('--sde <jobId>', 'SDE job identifier')
  .requiredOption('--fp <jobId>', 'Fokker–Planck job identifier')
  .action(async (options) => {
    const telemetry = configureTelemetry('diffusion.compare');
    await runDiffusionCompare({ sde: options.sde, fp: options.fp, telemetry });
  });

diffusion
  .command('export')
  .description('Export recorded frames to a JSON sequence file')
  .requiredOption('--job <jobId>', 'Job identifier to export')
  .requiredOption('--output <file>', 'Output file path')
  .action(async (options) => {
    const telemetry = configureTelemetry('diffusion.export');
    await runDiffusionExport({ job: options.job, output: options.output, telemetry });
  });

program.addCommand(diffusion);

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

const control = new Command('control').description('Control lab workflows');

control
  .command('hjb-solve')
  .description('Solve a PDE or MDP configuration and export artifacts')
  .requiredOption('--config <file>', 'Configuration JSON file')
  .action(async (options) => {
    const telemetry = configureTelemetry('control.hjb-solve');
    await runHjbSolve({ configPath: options.config, telemetry });
  });

control
  .command('hjb-rollout')
  .description('Simulate a rollout using an HJB configuration')
  .requiredOption('--config <file>', 'Configuration JSON file')
  .option('--start <values>', 'Comma separated start state')
  .option('--steps <n>', 'Number of steps', (value) => parseInt(value, 10))
  .option('--dt <value>', 'Time step', parseFloat)
  .option('--out <dir>', 'Output directory for rollout artifact')
  .action(async (options) => {
    const telemetry = configureTelemetry('control.hjb-rollout');
    await runHjbRollout({
      configPath: options.config,
      start: options.start,
      steps: options.steps,
      dt: options.dt,
      out: options.out,
      telemetry
    });
  });

program.addCommand(control);
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
const chat = new Command('chat').description('Collaborate with job threads');

chat
  .command('post')
  .description('Post a message into a job thread')
  .requiredOption('--job <id>', 'Job identifier')
  .requiredOption('--text <message>', 'Message to post')
  .option('--attachment <kind:url>', 'Attachment to include', (value, previous) => {
    if (previous) {
      return [...previous, value];
    }
    return [value];
  })
  .action(async (options) => {
    const telemetry = configureTelemetry('chat.post');
    await runChatPost({
      jobId: options.job,
      text: options.text,
      attachments: options.attachment,
      telemetry,
    });
  });

chat
  .command('tail')
  .description('Stream chat events for a job')
  .option('--job <id>', 'Job identifier (defaults to all jobs)')
  .action(async (options) => {
    const telemetry = configureTelemetry('chat.tail');
    await runChatTail({ jobId: options.job, telemetry });
  });

program.addCommand(chat);
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
  console.error(error);
  process.exit(1);
});
