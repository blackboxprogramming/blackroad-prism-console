import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { connect } from '../src/client';
import type { ChatMessage } from '../src/types';

interface MessageEvent {
  data?: string;
}

class FakeEventSource {
  static instances: FakeEventSource[] = [];

  url: string;
  closed = false;
  private listeners = new Map<string, ((event: MessageEvent) => void)[]>();

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    const items = this.listeners.get(type) ?? [];
    items.push(listener);
    this.listeners.set(type, items);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, data?: unknown) {
    const items = this.listeners.get(type) ?? [];
    const event = { data: data ? JSON.stringify(data) : undefined } as MessageEvent;
    items.forEach((listener) => listener(event));
  }
}

describe('chat-sdk SSE client', () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reconnects after an error and dispatches streamed messages', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [] as ChatMessage[],
    });

    const client = connect({
      jobId: 'job-1',
      protocol: 'sse',
      fetchImpl: fetchMock as unknown as typeof fetch,
      eventSourceCtor: FakeEventSource as unknown as typeof EventSource,
      retry: { initial: 50, max: 100 },
    });

    const handler = vi.fn();
    client.subscribe(handler);

    const first = FakeEventSource.instances[0];
    expect(first).toBeDefined();

    first.emit('message', {
      id: '1',
      jobId: 'job-1',
      author: 'agent',
      role: 'agent',
      ts: new Date().toISOString(),
      text: 'hello',
      reactions: {},
      attachments: [],
      redactions: [],
    });

    expect(handler).toHaveBeenCalledTimes(1);

    first.emit('error');

    vi.advanceTimersByTime(50);

    const second = FakeEventSource.instances[1];
    expect(second).toBeDefined();
    expect(first.closed).toBe(true);

    second.emit('message', {
      id: '2',
      jobId: 'job-1',
      author: 'agent',
      role: 'agent',
      ts: new Date().toISOString(),
      text: 'world',
      reactions: {},
      attachments: [],
      redactions: [],
    });

    expect(handler).toHaveBeenCalledTimes(2);

    await client.post('echo');
    expect(handler).toHaveBeenCalledTimes(3);

    client.close();
  });
});
