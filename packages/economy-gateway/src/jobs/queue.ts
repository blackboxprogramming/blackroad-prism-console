export interface SimulationJob {
  simulationId: string;
}

export class SimulationQueue {
  private queue: SimulationJob[] = [];
  private waiting: ((job: SimulationJob) => void)[] = [];

  enqueue(job: SimulationJob) {
    const listener = this.waiting.shift();
    if (listener) {
      listener(job);
    } else {
      this.queue.push(job);
    }
  }

  next(): Promise<SimulationJob> {
    const job = this.queue.shift();
    if (job) {
      return Promise.resolve(job);
    }
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }
}
