import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { z } from 'zod';
import { prisma } from '@blackroad/db';
import { ReconciliationService, StatementService, AuditExporter } from '@blackroad/core';
import { TraditionalCustodianCsvAdapter, CryptoExchangeCsvAdapter } from '@blackroad/adapters';

const app = Fastify({
  logger: true
});

app.register(multipart);

const reconService = new ReconciliationService(prisma);
const statementService = new StatementService(prisma);
const auditExporter = new AuditExporter(prisma);

const custodianAdapter = new TraditionalCustodianCsvAdapter('packages/adapters/config/fidelity.yaml');
const exchangeAdapter = new CryptoExchangeCsvAdapter('packages/adapters/config/coinbase.yaml');

app.post('/ingest/custodian', async (request, reply) => {
  const bodySchema = z.object({
    accountId: z.string(),
    date: z.coerce.date(),
    files: z.array(z.string()).min(1)
  });
  const body = bodySchema.parse(request.body);
  const [positions, cash, transactions] = await Promise.all([
    custodianAdapter.importPositions({ accountId: body.accountId, date: body.date, files: body.files }),
    custodianAdapter.importCash({ accountId: body.accountId, date: body.date, files: body.files }),
    custodianAdapter.importTransactions({ accountId: body.accountId, from: body.date, to: body.date, files: body.files })
  ]);

  await prisma.$transaction(async (tx) => {
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
        update: {
          balance: ledger.balance
        },
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

  return reply.status(202).send({ imported: { positions: positions.length, cash: cash.length, transactions: transactions.length } });
});

app.post('/ingest/exchange', async (request, reply) => {
  const bodySchema = z.object({
    accountId: z.string(),
    from: z.coerce.date(),
    to: z.coerce.date(),
    files: z.array(z.string()).min(1)
  });
  const body = bodySchema.parse(request.body);
  const transactions = await exchangeAdapter.importFills({ accountId: body.accountId, from: body.from, to: body.to, files: body.files });
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
  return reply.status(202).send({ imported: transactions.length });
});

app.post('/recon/run', async (request, reply) => {
  const querySchema = z.object({ asOf: z.string() });
  const query = querySchema.parse(request.query);
  await reconService.run({ asOf: new Date(query.asOf) });
  return { status: 'ok' };
});

app.get('/recon/breaks', async (request) => {
  const querySchema = z.object({
    status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'WAIVED']).optional(),
    accountId: z.string().optional()
  });
  const query = querySchema.parse(request.query);
  return prisma.reconBreak.findMany({
    where: {
      status: query.status,
      accountId: query.accountId
    },
    orderBy: { createdAt: 'desc' }
  });
});

app.post('/recon/breaks/:id/resolve', async (request, reply) => {
  const paramsSchema = z.object({ id: z.string() });
  const bodySchema = z.object({ note: z.string().optional() });
  const params = paramsSchema.parse(request.params);
  const body = bodySchema.parse(request.body);
  const breakRecord = await prisma.reconBreak.update({
    where: { id: params.id },
    data: { status: 'RESOLVED', notes: body.note, resolvedAt: new Date() }
  });
  await reconService.transitionBreak(breakRecord.accountId, breakRecord.key, breakRecord.scope, 'RESOLVED', body.note);
  return reply.send({ status: 'resolved' });
});

app.post('/recon/breaks/:id/waive', async (request, reply) => {
  const paramsSchema = z.object({ id: z.string() });
  const bodySchema = z.object({ reason: z.string() });
  const params = paramsSchema.parse(request.params);
  const body = bodySchema.parse(request.body);
  const breakRecord = await prisma.reconBreak.update({
    where: { id: params.id },
    data: { status: 'WAIVED', notes: body.reason, resolvedAt: new Date() }
  });
  await reconService.transitionBreak(breakRecord.accountId, breakRecord.key, breakRecord.scope, 'WAIVED', body.reason);
  return reply.send({ status: 'waived' });
});

app.post('/statements/generate', async (request) => {
  const bodySchema = z.object({ accountId: z.string(), period: z.string() });
  const body = bodySchema.parse(request.body);
  const path = await statementService.generateStatement(body.accountId, body.period);
  return { path };
});

app.get('/audit/export', async (request) => {
  const querySchema = z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    accountId: z.string(),
    out: z.string().default('artifacts/audit.zip')
  });
  const query = querySchema.parse(request.query);
  const path = await auditExporter.export({ accountId: query.accountId, from: query.from, to: query.to, outputPath: query.out });
  return { path };
});

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3333);
  app.listen({ port, host: '0.0.0.0' }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}

export default app;
