import { EventEnvelope } from '../envelope';

export interface IdempotencyOptions {
  ttlMs?: number;
}

export class IdempotencyTracker {
  private readonly seen = new Map<string, number>();

  private readonly ttlMs: number;

  constructor(options: IdempotencyOptions = {}) {
    this.ttlMs = options.ttlMs ?? 5 * 60 * 1000;
  }

  register(event: EventEnvelope): boolean {
    const key = this.keyFor(event);
    const now = Date.now();

    this.prune(now);

    const existing = this.seen.get(key);
    if (existing && now - existing < this.ttlMs) {
      return false;
    }

    this.seen.set(key, now);
    return true;
  }

  private prune(now: number): void {
    for (const [key, value] of this.seen.entries()) {
      if (now - value >= this.ttlMs) {
        this.seen.delete(key);
      }
    }
  }

  private keyFor(event: EventEnvelope): string {
    const idComponent = event.traceId ?? event.spanId ?? event.attrs?.['id'] ?? '';
    return [event.source, event.service, event.kind, event.ts, idComponent].join(':');
  }
}

