#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import {
  DeliveryEngine,
  FilingService,
  Gatekeeper,
  InMemoryClientOS,
  InMemoryLicenseMatrix,
  InMemoryRegDeskRepository,
  StubEmailDeliveryClient,
  StubIARDClient,
  StubStatePortalClient,
  exportAuditChain,
  generateEvents
} from '@blackroad/regdesk-core';
import { loadRulepack } from '@blackroad/regdesk-rules';
import { StaticComplianceOS } from '@blackroad/regdesk-integrations';
import { promises as fs } from 'node:fs';
import { basename } from 'node:path';

const program = new Command();
const repo = new InMemoryRegDeskRepository();
const compliance = new StaticComplianceOS([]);
const licenseMatrix = new InMemoryLicenseMatrix([], '2024-12-31');
const clientOS = new InMemoryClientOS([]);

const filingService = new FilingService({
  repo,
  licenseMatrix,
  compliance,
  iard: new StubIARDClient(),
  statePortal: new StubStatePortalClient(),
  actor: 'cli'
});

const deliveryEngine = new DeliveryEngine({
  repo,
  clientOS,
  email: new StubEmailDeliveryClient(),
  actor: 'cli'
});

program.name('blackroad-regdesk').description('BlackRoad RegDesk automation CLI').version('0.1.0');

program
  .command('rules publish')
  .argument('<files...>', 'Rulepack files (YAML/JSON)')
  .action(async (files: string[]) => {
    for (const file of files) {
      const rulepack = await loadRulepack(file);
      await repo.upsertRulepack({
        key: rulepack.key,
        version: rulepack.version,
        rules: rulepack.rules as any,
        sourceUrls: rulepack.sourceUrls
      });
      console.log(chalk.green(`Published ${rulepack.key}@${rulepack.version}`));
    }
  });

program
  .command('schedule generate')
  .requiredOption('--from <from>', 'Start date (ISO)')
  .requiredOption('--to <to>', 'End date (ISO)')
  .action(async (opts: { from: string; to: string }) => {
    const rulepacks = await repo.listRulepacks();
    const rules = rulepacks.flatMap((pack) => pack.rules as any);
    const events = await generateEvents({
      range: { from: new Date(opts.from), to: new Date(opts.to) },
      rules,
      context: {
        fiscalYearEnd: new Date('2024-12-31T00:00:00Z'),
        licenseExpiries: {},
        anniversaries: {}
      },
      repo,
      actor: 'cli'
    });
    console.log(chalk.blue(`Generated ${events.length} events`));
  });

program
  .command('events list')
  .option('--status <status>', 'Filter by status')
  .option('--track <track>', 'Filter by track')
  .action(async (opts: { status?: string; track?: string }) => {
    const events = await repo.listRegEvents({
      status: opts.status as any,
      track: opts.track as any
    });
    for (const event of events) {
      console.log(`${event.key} ${event.status} due ${event.due.toISOString()}`);
    }
  });

program
  .command('file')
  .requiredOption('--event <eventId>', 'RegEvent identifier')
  .option('--attach <paths>', 'Comma-separated artifact paths')
  .option('--submit', 'Submit filing after attaching')
  .action(async (opts: { event: string; attach?: string; submit?: boolean }) => {
    const event = (await repo.listRegEvents()).find((item) => item.id === opts.event || item.key === opts.event);
    if (!event) {
      console.error(chalk.red(`Event ${opts.event} not found`));
      process.exit(1);
    }
    const rule = {
      key: event.key,
      track: event.track,
      schedule: { freq: event.frequency, offsetFrom: 'FISCAL_YEAR_END', offsetDays: 0 },
      filing: { type: 'IARD', formKeys: [], artifactsRequired: ['PDF'], feePolicy: 'CALCULATED' }
    } as any;
    const filing = await filingService.build(event, rule);
    if (opts.attach) {
      const artifacts = opts.attach.split(',').map((file) => ({
        name: basename(file),
        path: file,
        checksum: 'sha256-placeholder'
      }));
      await filingService.attachArtifacts(filing.id, artifacts);
      console.log(chalk.green(`Attached ${artifacts.length} artifacts`));
    }
    if (opts.submit) {
      await filingService.submit(filing.id);
      console.log(chalk.green('Filing submitted'));
    }
  });

program
  .command('deliver')
  .requiredOption('--doc <doc>', 'Document kind')
  .requiredOption('--clients <ids>', 'Comma-separated client ids')
  .requiredOption('--method <method>', 'Delivery method')
  .requiredOption('--evidence <path>', 'Evidence path')
  .action(async (opts: { doc: any; clients: string; method: any; evidence: string }) => {
    const logs = await deliveryEngine.deliver({
      docKind: opts.doc,
      clients: opts.clients.split(','),
      method: opts.method,
      evidencePath: opts.evidence,
      version: new Date().toISOString().slice(0, 10)
    } as any);
    console.log(chalk.blue(`Logged ${logs.length} deliveries`));
  });

program
  .command('gates check')
  .requiredOption('--action <action>', 'Action key')
  .action(async (opts: { action: string }) => {
    const rulepacks = await repo.listRulepacks();
    const rules = rulepacks.flatMap((pack) => pack.rules as any);
    const gatekeeper = new Gatekeeper({ repo, rules, actor: 'cli' });
    await gatekeeper.evaluate();
    const result = await gatekeeper.check(opts.action);
    console.log(result.allowed ? chalk.green('Allowed') : chalk.red(`Blocked: ${result.reason}`));
  });

program
  .command('audit export')
  .requiredOption('--from <from>', 'Start index')
  .requiredOption('--to <to>', 'End index')
  .requiredOption('--out <file>', 'Output path')
  .action(async (opts: { from: string; to: string; out: string }) => {
    const blocks = await exportAuditChain(repo, {
      fromIdx: Number.parseInt(opts.from, 10),
      toIdx: Number.parseInt(opts.to, 10)
    });
    await fs.writeFile(opts.out, JSON.stringify(blocks, null, 2));
    console.log(chalk.green(`Wrote ${blocks.length} audit blocks to ${opts.out}`));
  });

program.parseAsync().catch((error) => {
  console.error(chalk.red(error.message));
  process.exit(1);
});
