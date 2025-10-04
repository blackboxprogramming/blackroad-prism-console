import { Queue, Worker } from "bullmq";

export interface QueueConfig {
  connection: {
    host: string;
    port: number;
  };
}

export const createComplianceQueues = (config: QueueConfig) => {
  const reviews = new Queue("compliance-reviews", { connection: config.connection });
  const ticklers = new Queue("compliance-ticklers", { connection: config.connection });
  const archival = new Queue("compliance-archival", { connection: config.connection });
  return { reviews, ticklers, archival };
};

export const createWorker = (name: string, processor: Parameters<typeof Worker>[1], config: QueueConfig) => {
  return new Worker(name, processor, { connection: config.connection });
};

export * from "./calendar.js";
