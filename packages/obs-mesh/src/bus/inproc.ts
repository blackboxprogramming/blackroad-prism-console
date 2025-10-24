import { EventEmitter } from 'node:events';
import { cloneEnvelope, EventEnvelope } from '../envelope';
import { IdempotencyTracker } from '../dedupe/idempotency';

export type EventListener = (event: EventEnvelope) => void;

export interface InprocBusOptions {
  dedupe?: IdempotencyTracker;
  maxListeners?: number;
}

export class InprocEventBus {
  private readonly emitter: EventEmitter;

  private readonly dedupe?: IdempotencyTracker;

  constructor(options: InprocBusOptions = {}) {
    this.emitter = new EventEmitter({ captureRejections: false });
    if (options.maxListeners) {
      this.emitter.setMaxListeners(options.maxListeners);
    }
    this.dedupe = options.dedupe;
  }

  publish(event: EventEnvelope): void {
    if (this.dedupe && !this.dedupe.register(event)) {
      return;
    }

    // clone to keep bus immutable for consumers
    const cloned = cloneEnvelope(event);
    queueMicrotask(() => this.emitter.emit('event', cloned));
  }

  subscribe(listener: EventListener): () => void {
    const wrapped: EventListener = (event) => listener(cloneEnvelope(event));
    const emitterListener = wrapped as unknown as (...args: unknown[]) => void;
    this.emitter.on('event', emitterListener);
    return () => {
      this.emitter.off('event', emitterListener);
    };
  }
}

