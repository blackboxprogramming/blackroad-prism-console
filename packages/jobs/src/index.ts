import { Queue, Worker, QueueScheduler, type QueueOptions } from 'bullmq';
import { ReconciliationService, StatementService, AuditExporter } from '@blackroad/core';
import { prisma } from '@blackroad/db';

export const queueNames = {
  ingestCustodian: 'ingest:custodian',
  ingestExchange: 'ingest:exchange',
  ingestOnchain: 'ingest:onchain',
  reconPositions: 'recon:positions',
  reconCash: 'recon:cash',
  reconTrades: 'recon:trades',
  reconCostBasis: 'recon:costbasis',
  pricingUpdate: 'pricing:update-eod',
  statementsMonthly: 'statements:monthly',
  statementsQuarterly: 'statements:quarterly'
} as const;

type QueueName = (typeof queueNames)[keyof typeof queueNames];

export interface JobContext {
  reconciliation: ReconciliationService;
  statements: StatementService;
  audit: AuditExporter;
}

export class JobRegistry {
  private readonly scheduler: QueueScheduler;
  private readonly workers: Worker[] = [];
  private readonly queue: Queue;

  constructor(queueName: QueueName, options: QueueOptions = {}, private readonly context: JobContext) {
    this.queue = new Queue(queueName, options);
    this.scheduler = new QueueScheduler(queueName, options);
    this.workers.push(
      new Worker(
        queueName,
        async (job) => {
          switch (job.name) {
            case queueNames.reconPositions:
            case queueNames.reconCash:
            case queueNames.reconTrades:
            case queueNames.reconCostBasis:
              await context.reconciliation.run({ asOf: new Date(job.data.asOf) });
              break;
            case queueNames.statementsMonthly:
            case queueNames.statementsQuarterly:
              await context.statements.generateStatement(job.data.accountId, job.data.period);
              break;
            default:
              break;
          }
        },
        options
      )
    );
  }

  async add(name: QueueName, data: Record<string, unknown>): Promise<void> {
    await this.queue.add(name, data, { jobId: `${name}:${JSON.stringify(data)}` });
  }

  async close(): Promise<void> {
    await this.queue.close();
    await this.scheduler.close();
    await Promise.all(this.workers.map((worker) => worker.close()));
  }
}

export function createDefaultJobContext(): JobContext {
  return {
    reconciliation: new ReconciliationService(prisma),
    statements: new StatementService(prisma),
    audit: new AuditExporter(prisma)
  };
}
