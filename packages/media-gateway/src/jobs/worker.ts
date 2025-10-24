import { CaptionJob } from '../types';
import { CaptionJobQueue } from './queue';

export interface WorkerOptions {
  intervalMs?: number;
}

export type JobExecutor = (job: CaptionJob) => Promise<CaptionJob>;

export class CaptionWorker {
  private timer?: NodeJS.Timeout;

  constructor(private readonly queue: CaptionJobQueue, private readonly execute: JobExecutor, private readonly options: WorkerOptions = {}) {}

  start() {
    if (this.timer) {
      return;
    }
    const interval = this.options.intervalMs ?? 500;
    this.timer = setInterval(async () => {
      for (const job of this.snapshot()) {
        if (job.status === 'QUEUED') {
          const running = { ...job, status: 'RUNNING', updatedAt: new Date().toISOString() };
          this.queue.update(running);
          const completed = await this.execute(running);
          this.queue.update({ ...completed, updatedAt: new Date().toISOString() });
        }
      }
    }, interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private snapshot(): CaptionJob[] {
    return this.queue.all();
  }
}
