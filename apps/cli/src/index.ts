#!/usr/bin/env node
import { Command } from 'commander';
import ora from 'ora';
import { prisma } from '@blackroad/db';
import { ReconciliationService, StatementService, AuditExporter } from '@blackroad/core';
import { TraditionalCustodianCsvAdapter, CryptoExchangeCsvAdapter } from '@blackroad/adapters';

const program = new Command();
const reconService = new ReconciliationService(prisma);
const statementService = new StatementService(prisma);
const auditExporter = new AuditExporter(prisma);
const custodianAdapter = new TraditionalCustodianCsvAdapter('packages/adapters/config/fidelity.yaml');
const exchangeAdapter = new CryptoExchangeCsvAdapter('packages/adapters/config/coinbase.yaml');

program
  .name('blackroad-custodysync')
  .description('CustodySync operations CLI for BlackRoad Finance');

program
  .command('init')
  .requiredOption('--owner <name>', 'Owner name')
  .action(async (opts) => {
    const spinner = ora('Seeding owner and default account').start();
    try {
      const ownerId = opts.owner;
      await prisma.account.upsert({
        where: { accountNo: 'ACC-001' },
        update: { ownerId },
        create: {
          id: 'ACC-001',
          ownerId,
          custodian: 'FIDELITY',
          accountNo: 'ACC-001',
          type: 'TAXABLE',
          baseCurrency: 'USD',
          meta: { costMethod: 'FIFO' }
        }
      });
      spinner.succeed(`Initialized for ${ownerId}`);
    } catch (err) {
      spinner.fail((err as Error).message);
      process.exitCode = 1;
    }
  });

program
  .command('import')
  .argument('<source>', 'custodian|exchange')
  .argument('<files...>')
  .requiredOption('--account <id>', 'Account ID')
  .option('--date <date>', 'As of date')
  .option('--from <date>', 'From date')
  .option('--to <date>', 'To date')
  .action(async (source, files, command) => {
    const options = command.opts();
    const spinner = ora(`Importing from ${source}`).start();
    try {
      if (source === 'custodian') {
        const date = options.date ? new Date(options.date) : new Date();
        await prisma.$transaction(async (tx) => {
          const [positions, cash, transactions] = await Promise.all([
            custodianAdapter.importPositions({ accountId: options.account, date, files }),
            custodianAdapter.importCash({ accountId: options.account, date, files }),
            custodianAdapter.importTransactions({ accountId: options.account, from: date, to: date, files })
          ]);
          for (const snapshot of positions) {
            await tx.positionSnapshot.upsert({
              where: {
                accountId_instrumentId_asOf_source: {
                  accountId: snapshot.accountId,
                  instrumentId: snapshot.instrumentId,
                  asOf: snapshot.asOf,
                  source: 'CUSTODIAN'
                }
              },
              update: {
                quantity: snapshot.quantity,
                marketValue: snapshot.marketValue,
                price: snapshot.price
              },
              create: snapshot
            });
          }
          for (const ledger of cash) {
            await tx.cashLedger.upsert({
              where: {
                accountId_currency_asOf_source: {
                  accountId: ledger.accountId,
                  currency: ledger.currency,
                  asOf: ledger.asOf,
                  source: 'CUSTODIAN'
                }
              },
              update: { balance: ledger.balance },
              create: ledger
            });
          }
          for (const transaction of transactions) {
            const externalId = transaction.externalId ?? transaction.id ?? `${transaction.accountId}-${transaction.tradeDate.toISOString()}-${transaction.type}`;
            await tx.transaction.upsert({
              where: {
                accountId_externalId: {
                  accountId: transaction.accountId,
                  externalId
                }
              },
              update: transaction,
              create: { ...transaction, externalId }
            });
          }
        });
      } else if (source === 'exchange') {
        const from = options.from ? new Date(options.from) : new Date();
        const to = options.to ? new Date(options.to) : from;
        const transactions = await exchangeAdapter.importFills({ accountId: options.account, from, to, files });
        await prisma.$transaction(async (tx) => {
          for (const transaction of transactions) {
            const externalId = transaction.externalId ?? transaction.id ?? `${transaction.accountId}-${transaction.tradeDate.toISOString()}-${transaction.type}`;
            await tx.transaction.upsert({
              where: {
                accountId_externalId: {
                  accountId: transaction.accountId,
                  externalId
                }
              },
              update: transaction,
              create: { ...transaction, externalId }
            });
          }
        });
      } else {
        throw new Error(`Unknown source ${source}`);
      }
      spinner.succeed('Import complete');
    } catch (err) {
      spinner.fail((err as Error).message);
      process.exitCode = 1;
    }
  });

program
  .command('recon')
  .requiredOption('--as-of <date>', 'As of date')
  .action(async (opts) => {
    const spinner = ora('Running reconciliation').start();
    try {
      await reconService.run({ asOf: new Date(opts.asOf) });
      spinner.succeed('Reconciliation completed');
    } catch (err) {
      spinner.fail((err as Error).message);
      process.exitCode = 1;
    }
  });

program
  .command('breaks')
  .option('--status <status>', 'Break status')
  .action(async (opts) => {
    const breaks = await prisma.reconBreak.findMany({ where: { status: opts.status } });
    breaks.forEach((br) => {
      console.log(`${br.id} ${br.scope} ${br.status} delta=${Number(br.internal ?? 0) - Number(br.external ?? 0)}`);
    });
  });

const statements = program.command('statements');

statements
  .command('generate')
  .requiredOption('--account <id>', 'Account ID')
  .requiredOption('--period <period>', 'Period identifier e.g. 2025Q3')
  .action(async (opts) => {
    const spinner = ora('Generating statement').start();
    try {
      const path = await statementService.generateStatement(opts.account, opts.period);
      spinner.succeed(`Statement created at ${path}`);
    } catch (err) {
      spinner.fail((err as Error).message);
      process.exitCode = 1;
    }
  });

const audit = program.command('audit');

audit
  .command('export')
  .requiredOption('--account <id>', 'Account ID')
  .requiredOption('--from <date>', 'From date')
  .requiredOption('--to <date>', 'To date')
  .requiredOption('--out <path>', 'Output zip path')
  .action(async (opts) => {
    const spinner = ora('Exporting audit package').start();
    try {
      const path = await auditExporter.export({
        accountId: opts.account,
        from: new Date(opts.from),
        to: new Date(opts.to),
        outputPath: opts.out
      });
      spinner.succeed(`Audit export ready at ${path}`);
    } catch (err) {
      spinner.fail((err as Error).message);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);
