import { randomUUID } from 'crypto';
import { CaptionJob, CaptionCreateInput } from '../types';
import { CaptionJobQueue } from '../jobs/queue';
import { withSpan } from '../otel';

export class CaptionResolver {
  constructor(private readonly queue: CaptionJobQueue) {}

  create(input: CaptionCreateInput): CaptionJob {
    const now = new Date().toISOString();
    const job: CaptionJob = {
      id: randomUUID(),
      assetId: input.assetId,
      backend: input.backend ?? 'local',
      status: 'QUEUED',
      createdAt: now,
      updatedAt: now,
      artifacts: []
    };
    withSpan('caption.create', () => {
      this.queue.enqueue(job);
    });
    return job;
  }

  get(jobId: string): CaptionJob | undefined {
    return withSpan('caption.get', () => this.queue.get(jobId));
  }

  events(assetId?: string): AsyncIterable<CaptionJob> {
    const queue = this.queue;
    return {
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<CaptionJob>> {
            return new Promise((resolve) => {
              const unsubscribe = queue.subscribe((job) => {
                if (!assetId || job.assetId === assetId) {
                  unsubscribe();
                  resolve({ value: job, done: false });
                }
              });
            });
          }
        };
      }
    };
  }
}
