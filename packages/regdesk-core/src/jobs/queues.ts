import { Queue, Worker, type Job } from 'bullmq';
import { createClient } from 'redis';
import type { Rule } from '@blackroad/regdesk-rules';
import type { RegDeskRepository } from '../utils/repository.js';
import type { ScheduleContext, ScheduleRange } from '../types.js';
import { generateEvents } from '../scheduler/generator.js';

export interface QueueConfig {
  connection: Parameters<typeof createClient>[0];
}

export interface ScheduleJobData {
  range: ScheduleRange;
  rules: Rule[];
  context: ScheduleContext;
  actor: string;
}

export function createScheduleQueue(config: QueueConfig) {
  return new Queue<ScheduleJobData>('regdesk.schedule', { connection: config.connection });
}

export function createScheduleWorker(
  config: QueueConfig,
  repo: RegDeskRepository
): Worker<ScheduleJobData> {
  return new Worker<ScheduleJobData>(
    'regdesk.schedule',
    async (job: Job<ScheduleJobData>) => {
      await generateEvents({
        range: job.data.range,
        rules: job.data.rules,
        context: job.data.context,
        repo,
        actor: job.data.actor
      });
    },
    { connection: config.connection }
  );
}
