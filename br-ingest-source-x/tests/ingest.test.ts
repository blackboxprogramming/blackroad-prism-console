import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PoolClient } from 'pg';

vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

import fetch from 'node-fetch';
import { ingestSourceX } from '../src/ingest.js';

type Mocked<T> = T extends (...args: infer A) => infer R ? vi.Mock<R, A> : never;

describe('Source X ingestion', () => {
  beforeEach(() => {
    (fetch as Mocked<typeof fetch>).mockReset();
    delete process.env.MAX_ITEMS_PER_RUN;
  });

  it('batches API pages until the upstream signals completion', async () => {
    const events = [
      { id: 'evt-1', occurred_at: '2024-06-01T00:00:00Z', type: 'created' },
      { id: 'evt-2', occurred_at: '2024-06-01T01:00:00Z', kind: 'updated' },
    ];
    const more = [
      { id: 'evt-3', occurred_at: '2024-06-01T02:00:00Z' },
    ];

    (fetch as Mocked<typeof fetch>)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: events, next: 'https://api.next/page' }) } as any)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: more, next: null }) } as any);

    const query = vi.fn().mockResolvedValue(undefined);
    const client = { query } as unknown as PoolClient;

    const count = await ingestSourceX(client, 'source-1', 'token');
    expect(count).toBe(3);
    expect(fetch).toHaveBeenCalledTimes(2);
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('insert into raw_source_x_events');
    expect(values).toHaveLength(events.length * 5);
    const [, sourceId] = values;
    expect(sourceId).toBe('source-1');
  });

  it('raises when the token is rejected by the upstream API', async () => {
    (fetch as Mocked<typeof fetch>).mockResolvedValue({ ok: false, status: 401 } as any);
    const client = { query: vi.fn() } as unknown as PoolClient;
    await expect(ingestSourceX(client, 'source-1', 'token')).rejects.toThrow('Token invalid or revoked');
  });
});
