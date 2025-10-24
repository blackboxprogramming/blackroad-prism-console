import { SimulationQueue, SimulationJob } from './queue';

type JobHandler = (job: SimulationJob) => Promise<void>;

export function startWorker(queue: SimulationQueue, handler: JobHandler) {
  async function loop() {
    while (true) {
      const job = await queue.next();
      try {
        await handler(job);
      } catch (error) {
        console.error('[economy-gateway] worker error', error);
      }
    }
  }

  void loop();
}
