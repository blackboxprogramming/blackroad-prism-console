import { Queue, QueueScheduler, Worker, type QueueOptions } from "bullmq";
import type { RedisOptions } from "ioredis";
import type { WormLedger } from "@blackroad/worm";
import {
  BcpService,
  EntitlementService,
  IncidentService,
  KriService,
  SodEngine,
  VendorService,
  type GrcRepository,
} from "@blackroad/grc-core";

export interface JobDependencies {
  repository: GrcRepository;
  worm: WormLedger;
  connection?: RedisOptions;
}

export interface RegisteredJob {
  queue: Queue;
  worker: Worker;
}

function queueOptions(connection?: RedisOptions): QueueOptions {
  return connection ? { connection } : {};
}

export function registerRecertJob(deps: JobDependencies): RegisteredJob {
  const queueName = "recerts";
  const queue = new Queue(queueName, queueOptions(deps.connection));
  new QueueScheduler(queueName, queueOptions(deps.connection));
  const entitlements = new EntitlementService(
    deps.repository,
    new SodEngine(deps.repository, deps.worm),
    deps.worm,
  );
  const worker = new Worker(
    queueName,
    async () => {
      const now = new Date();
      const needing = await deps.repository.listEntitlementsNeedingRecert(now);
      for (const entitlement of needing) {
        if (entitlement.recertDue && entitlement.recertDue < now) {
          await entitlements.expire(entitlement.id);
        }
      }
    },
    queueOptions(deps.connection),
  );
  return { queue, worker };
}

export function registerVendorDdqJob(deps: JobDependencies): RegisteredJob {
  const queueName = "vendor_ddq";
  const queue = new Queue(queueName, queueOptions(deps.connection));
  new QueueScheduler(queueName, queueOptions(deps.connection));
  const vendorService = new VendorService(deps.repository, deps.worm);
  const worker = new Worker(
    queueName,
    async () => {
      const vendors = await deps.repository.listVendors();
      for (const vendor of vendors) {
        await vendorService.recalculateRisk(vendor.id);
      }
    },
    queueOptions(deps.connection),
  );
  return { queue, worker };
}

export function registerIncidentSlaJob(deps: JobDependencies): RegisteredJob {
  const queueName = "incident_sla";
  const queue = new Queue(queueName, queueOptions(deps.connection));
  new QueueScheduler(queueName, queueOptions(deps.connection));
  const incidents = new IncidentService(deps.repository, deps.worm);
  const worker = new Worker(
    queueName,
    async () => {
      const metrics = await incidents.metrics();
      await deps.worm.append({
        payload: {
          type: "IncidentSlaComputed",
          metrics,
        },
      });
    },
    queueOptions(deps.connection),
  );
  return { queue, worker };
}

export function registerKriRollupJob(deps: JobDependencies): RegisteredJob {
  const queueName = "kri_rollup";
  const queue = new Queue(queueName, queueOptions(deps.connection));
  new QueueScheduler(queueName, queueOptions(deps.connection));
  const kpi = new KriService(deps.repository, deps.worm);
  const worker = new Worker(
    queueName,
    async () => {
      await kpi.rollup();
    },
    queueOptions(deps.connection),
  );
  return { queue, worker };
}

export function registerBcpTestJob(deps: JobDependencies): RegisteredJob {
  const queueName = "bcptest";
  const queue = new Queue(queueName, queueOptions(deps.connection));
  new QueueScheduler(queueName, queueOptions(deps.connection));
  const bcp = new BcpService(deps.repository, deps.worm);
  const worker = new Worker(
    queueName,
    async () => {
      const plan = await deps.repository.getActiveBcpPlan();
      if (plan) {
        await bcp.ensureCadence(plan.id);
      }
    },
    queueOptions(deps.connection),
  );
  return { queue, worker };
}

export const JOB_NAMES = {
  recerts: "recerts",
  vendorDdq: "vendor_ddq",
  incidentSla: "incident_sla",
  kriRollup: "kri_rollup",
  bcpTest: "bcptest",
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

export function registerAllJobs(deps: JobDependencies): Record<JobName, RegisteredJob> {
  return {
    recerts: registerRecertJob(deps),
    vendor_ddq: registerVendorDdqJob(deps),
    incident_sla: registerIncidentSlaJob(deps),
    kri_rollup: registerKriRollupJob(deps),
    bcptest: registerBcpTestJob(deps),
  } as Record<JobName, RegisteredJob>;
}
