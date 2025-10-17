import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

import fetch from 'node-fetch';
import { iterIssues, ISSUES_Q, LinearIssue } from '../src/linear.js';

type Mocked<T> = T extends (...args: infer A) => infer R ? vi.Mock<R, A> : never;

describe('Linear issue iterator', () => {
  beforeEach(() => {
    (fetch as Mocked<typeof fetch>).mockReset();
  });

  it('paginates through Linear issues until the final page', async () => {
    const firstPage = {
      data: {
        issues: {
          nodes: [{ id: '1', identifier: 'ENG-1' }] as LinearIssue[],
          pageInfo: { hasNextPage: true, endCursor: 'cursor1' },
        },
      },
    };
    const secondPage = {
      data: {
        issues: {
          nodes: [{ id: '2', identifier: 'ENG-2' }] as LinearIssue[],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    };

    (fetch as Mocked<typeof fetch>)
      .mockResolvedValueOnce({ ok: true, json: async () => firstPage } as any)
      .mockResolvedValueOnce({ ok: true, json: async () => secondPage } as any);

    const batches: LinearIssue[][] = [];
    for await (const batch of iterIssues('token', 'ENG', '2024-01-01T00:00:00Z')) {
      batches.push(batch);
    }

    expect(fetch).toHaveBeenCalledTimes(2);
    const body = JSON.parse((fetch as Mocked<typeof fetch>).mock.calls[0][1]!.body as string);
    expect(body.query).toBe(ISSUES_Q);
    expect(body.variables).toMatchObject({ teamKey: 'ENG' });
    expect(batches).toEqual([[{ id: '1', identifier: 'ENG-1' }], [{ id: '2', identifier: 'ENG-2' }]]);
  });

  it('raises when Linear responds with an error status', async () => {
    (fetch as Mocked<typeof fetch>).mockResolvedValueOnce({ ok: false, status: 500 } as any);
    await expect(async () => {
      for await (const _ of iterIssues('token', 'ENG', '2024-01-01T00:00:00Z')) {
        return _;
      }
    }).rejects.toThrow('Linear 500');
  });
});
