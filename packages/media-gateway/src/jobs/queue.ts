import { EventEmitter } from 'events';
import { CaptionJob } from '../types';

type QueueEvent = 'updated' | 'created';

export class CaptionJobQueue extends EventEmitter {
  private readonly jobs = new Map<string, CaptionJob>();

  constructor() {
    super();
  }

  enqueue(job: CaptionJob) {
    this.jobs.set(job.id, job);
    this.emit('created', job);
  }

  update(job: CaptionJob) {
    this.jobs.set(job.id, job);
    this.emit('updated', job);
  }

  get(jobId: string): CaptionJob | undefined {
    return this.jobs.get(jobId);
  }

  all(): CaptionJob[] {
    return Array.from(this.jobs.values());
  }

  subscribe(listener: (job: CaptionJob) => void): () => void {
    const handler = (job: CaptionJob) => listener(job);
    this.on('created', handler);
    this.on('updated', handler);
    return () => {
      this.off('created', handler);
      this.off('updated', handler);
    };
  }
}

export type { QueueEvent };
