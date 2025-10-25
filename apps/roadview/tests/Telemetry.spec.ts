import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTelemetryBuffer, TelemetryEvent } from '../lib/telemetry';

type MemoryStorageData = {
  [key: string]: string;
};

class MemoryStorage {
  constructor(private store: MemoryStorageData = {}) {}
  getItem(key: string) {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
}

describe('telemetry batching', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('flushes when batch size is reached', () => {
    const batches: TelemetryEvent[][] = [];
    const buffer = createTelemetryBuffer({
      storage,
      maxBatchSize: 2,
      flushInterval: 10_000,
      logger: (events) => batches.push(events),
      now: () => 1
    });

    buffer.track('search', { q: 'alpha', count: 1, durationMs: 10 });
    expect(JSON.parse(storage.getItem('roadview.telemetry.queue') ?? '[]')).toHaveLength(1);

    buffer.track('filter_change', { facet: 'bias', value: 'left' });

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(2);
    expect(storage.getItem('roadview.telemetry.queue')).toBe('[]');
  });

  it('flushes after interval if batch size not reached', () => {
    vi.useFakeTimers();
    const batches: TelemetryEvent[][] = [];
    const buffer = createTelemetryBuffer({
      storage,
      maxBatchSize: 10,
      flushInterval: 1000,
      logger: (events) => batches.push(events),
      now: () => Date.now()
    });

    buffer.track('search', { q: 'beta', count: 2, durationMs: 20 });
    expect(batches).toHaveLength(0);

    vi.advanceTimersByTime(1200);

    expect(batches).toHaveLength(1);
    expect(batches[0][0].type).toBe('search');
  });
});
