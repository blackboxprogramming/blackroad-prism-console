import { PoolClient } from 'pg';
import type { ATRecord } from './airtable.js';

export async function upsertProjects(client: PoolClient, records: ATRecord[]) {
  if (records.length === 0) return 0;

  const values: any[] = [];
  const rows: string[] = [];

  records.forEach((r, i) => {
    const createdAt = typeof r.fields.CreatedAt === 'string'
      ? new Date(r.fields.CreatedAt)
      : r.fields.CreatedAt;

    values.push(
      r.id,
      r.fields.Name ?? null,
      r.fields.OwnerEmail ?? null,
      r.fields.Status ?? null,
      createdAt ?? new Date(r.createdTime)
    );
    const base = i * 5;
    rows.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
  });

  const sql = `
    insert into ops.projects(project_id, project_name, owner_email, status, created_at)
    values ${rows.join(',')}
    on conflict (project_id) do update set
      project_name = excluded.project_name,
      owner_email  = excluded.owner_email,
      status       = excluded.status,
      created_at   = coalesce(ops.projects.created_at, excluded.created_at),
      updated_at   = now()
  `;
  const res = await client.query(sql, values);
  return res.rowCount ?? records.length;
}
