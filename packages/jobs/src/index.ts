import { Queue, QueueEvents, QueueScheduler, Worker, QueueOptions, JobsOptions } from "bullmq";
import { createMessageIngestor } from "@blackroad/connectors";
import {
  ScenarioEngine,
  scanCommunications,
  seedLexicons,
  CaseService,
  SuppressionService,
  AlertDeduper,
  RetentionService,
} from "@lucidia/core";
import { WormLedger } from "@blackroad/worm";

export interface QueueFactoryConfig {
  connection: QueueOptions["connection"];
  prefix?: string;
}

export interface SurveillanceQueues {
  ingestComms: Queue;
  runScenarios: Queue;
  lexiconScan: Queue;
  caseSla: Queue;
  retentionGc: Queue;
  events: QueueEvents[];
  schedulers: QueueScheduler[];
}

export function createSurveillanceQueues(config: QueueFactoryConfig): SurveillanceQueues {
  const prefix = config.prefix ?? "surv";
  const ingestComms = new Queue(`${prefix}:ingest_comms`, { connection: config.connection });
  const runScenarios = new Queue(`${prefix}:run_scenarios`, { connection: config.connection });
  const lexiconScan = new Queue(`${prefix}:lexicon_scan`, { connection: config.connection });
  const caseSla = new Queue(`${prefix}:case_sla`, { connection: config.connection });
  const retentionGc = new Queue(`${prefix}:retention_gc`, { connection: config.connection });

  const events = [
    new QueueEvents(`${prefix}:ingest_comms`, { connection: config.connection }),
    new QueueEvents(`${prefix}:run_scenarios`, { connection: config.connection }),
    new QueueEvents(`${prefix}:lexicon_scan`, { connection: config.connection }),
    new QueueEvents(`${prefix}:case_sla`, { connection: config.connection }),
    new QueueEvents(`${prefix}:retention_gc`, { connection: config.connection }),
  ];

  const schedulers = [
    new QueueScheduler(`${prefix}:run_scenarios`, { connection: config.connection }),
    new QueueScheduler(`${prefix}:lexicon_scan`, { connection: config.connection }),
    new QueueScheduler(`${prefix}:case_sla`, { connection: config.connection }),
    new QueueScheduler(`${prefix}:retention_gc`, { connection: config.connection }),
  ];

  return { ingestComms, runScenarios, lexiconScan, caseSla, retentionGc, events, schedulers };
}

export interface WorkerConfig {
  ledger: WormLedger;
  caseService: CaseService;
  suppression: SuppressionService;
  deduper: AlertDeduper;
  retention: RetentionService;
  engine?: ScenarioEngine;
}

export function registerWorkers(queues: SurveillanceQueues, config: WorkerConfig): Worker[] {
  const engine = config.engine ?? new ScenarioEngine();

  const ingestWorker = new Worker(
    queues.ingestComms.name,
    async (job) => {
      const ingestor = createMessageIngestor({ ledger: config.ledger });
      const comm = await ingestor(job.data.message);
      await config.retention.archive(comm, comm.retentionKey);
      return comm;
    },
    { connection: queues.ingestComms.opts.connection }
  );

  const scenarioWorker = new Worker(
    queues.runScenarios.name,
    async (job) => {
      const alerts = await engine.run(job.data.context);
      const filtered = config.deduper.filter(alerts).filter((alert) => !config.suppression.shouldSuppress(alert));
      filtered.forEach((alert) => config.caseService.ingestAlert(alert));
      return { count: filtered.length };
    },
    { connection: queues.runScenarios.opts.connection }
  );

  const lexiconWorker = new Worker(
    queues.lexiconScan.name,
    async (job) => {
      const { comms } = job.data;
      const { alerts } = scanCommunications(comms, seedLexicons);
      const filtered = config.deduper.filter(alerts).filter((alert) => !config.suppression.shouldSuppress(alert));
      filtered.forEach((alert) => config.caseService.ingestAlert(alert));
      return { count: filtered.length };
    },
    { connection: queues.lexiconScan.opts.connection }
  );

  const caseSlaWorker = new Worker(
    queues.caseSla.name,
    async () => {
      // TODO: escalate cases based on SLA policies once defined.
      return { escalated: 0 };
    },
    { connection: queues.caseSla.opts.connection }
  );

  const retentionWorker = new Worker(
    queues.retentionGc.name,
    async () => {
      const expired = config.retention.markExpired(new Date());
      const purged = config.retention.purgeExpired();
      return { expired: expired.length, purged: purged.length };
    },
    { connection: queues.retentionGc.opts.connection }
  );

  return [ingestWorker, scenarioWorker, lexiconWorker, caseSlaWorker, retentionWorker];
}

export const defaultJobOptions: JobsOptions = {
  removeOnComplete: true,
  attempts: 3,
};
