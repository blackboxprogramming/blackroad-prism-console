import { Queue } from "bullmq";

export interface JobQueue<T = unknown> {
  add(name: string, data: T): Promise<void>;
}

class InMemoryQueue<T> implements JobQueue<T> {
  private jobs: { name: string; data: T }[] = [];

  async add(name: string, data: T): Promise<void> {
    this.jobs.push({ name, data });
  }

  drain(): { name: string; data: T }[] {
    const jobs = [...this.jobs];
    this.jobs.length = 0;
    return jobs;
  }
}

export function createJobQueue<T>(name: string, connection?: ConstructorParameters<typeof Queue>[1]["connection"]): JobQueue<T> {
  if (connection) {
    const queue = new Queue<T>(name, { connection });
    return {
      async add(jobName: string, data: T) {
        await queue.add(jobName, data);
      },
    };
  }
  return new InMemoryQueue<T>();
}
