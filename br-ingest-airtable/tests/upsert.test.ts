import { describe, it, expect, vi } from 'vitest';
import type { PoolClient } from 'pg';
import { upsertProjects } from '../src/upsert.js';
import type { ATRecord } from '../src/airtable.js';

describe('upsertProjects', () => {
  it('returns zero without touching the database when no records are provided', async () => {
    const client = { query: vi.fn() } as unknown as PoolClient;
    const count = await upsertProjects(client, []);
    expect(count).toBe(0);
    expect(client.query).not.toHaveBeenCalled();
  });

  it('formats the bulk upsert correctly for Airtable records', async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 2 });
    const client = { query } as unknown as PoolClient;

    const created = new Date('2024-05-01T12:00:00Z');
    const records: ATRecord[] = [
      {
        id: 'rec1',
        createdTime: '2024-05-02T00:00:00Z',
        fields: {
          Name: 'Project Uno',
          OwnerEmail: 'owner@example.com',
          Status: 'Active',
          CreatedAt: created.toISOString(),
        },
      },
      {
        id: 'rec2',
        createdTime: '2024-05-03T00:00:00Z',
        fields: {
          Name: undefined,
          OwnerEmail: undefined,
          Status: undefined,
        },
      },
    ];

    const result = await upsertProjects(client, records);

    expect(result).toBe(2);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, values] = query.mock.calls[0] as [string, unknown[]];

    expect(sql).toContain('insert into ops.projects');
    expect(sql).toContain('on conflict (project_id) do update');
    expect(values).toEqual([
      'rec1',
      'Project Uno',
      'owner@example.com',
      'Active',
      new Date(created.toISOString()),
      'rec2',
      null,
      null,
      null,
      new Date('2024-05-03T00:00:00Z'),
    ]);
  });
});
