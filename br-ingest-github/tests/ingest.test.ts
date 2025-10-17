import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PoolClient } from 'pg';

vi.mock('../src/gh.js', () => ({
  iterIssues: vi.fn(),
}));

import { ingestRepo } from '../src/ingest.js';
import { parseLinkNext } from '../src/util.js';
import { iterIssues } from '../src/gh.js';

type Mocked<T> = T extends (...args: infer A) => infer R ? vi.Mock<R, A> : never;

describe('GitHub ingest helpers', () => {
  beforeEach(() => {
    (iterIssues as Mocked<typeof iterIssues>).mockReset();
  });

  it('parses the next link header correctly', () => {
    const header = '<https://api.github.com/repos/org/repo/issues?page=2>; rel="next", <...>; rel="last"';
    expect(parseLinkNext(header)).toBe('https://api.github.com/repos/org/repo/issues?page=2');
    expect(parseLinkNext(null)).toBe('');
  });

  it('streams issues into the raw table in batches', async () => {
    const first = [{
      id: 1,
      number: 99,
      title: 'Bug',
      state: 'open',
      pull_request: undefined,
      labels: [{ name: 'bug' }],
      user: { login: 'alice' },
      created_at: '2024-06-01T00:00:00Z',
      closed_at: null,
      updated_at: '2024-06-02T00:00:00Z',
    }];
    const second: any[] = [];

    (iterIssues as Mocked<typeof iterIssues>).mockImplementation(async function* () {
      yield first as any;
      yield second;
    });

    const query = vi.fn().mockResolvedValue({ rowCount: first.length });
    const client = { query } as unknown as PoolClient;

    const total = await ingestRepo(client, 'org/repo', '2024-05-01T00:00:00Z', 'token');
    expect(total).toBe(1);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('insert into raw_github_issues');
    expect(sql).toContain('on conflict (id) do update');
    expect(values).toHaveLength(12);
    expect(values[0]).toBe(1);
    expect(values[1]).toBe('org/repo');
    expect(JSON.parse(values[6] as string)).toEqual([{ name: 'bug' }]);
  });
});
