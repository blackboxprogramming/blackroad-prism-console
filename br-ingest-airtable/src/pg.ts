import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.PG_URL,
  application_name: 'br-ingest-airtable',
});

export async function withClient<T>(fn: (c: any) => Promise<T>) {
  const client = await pool.connect();
  try { return await fn(client); }
  finally { client.release(); }
}

export async function getLastRun() {
  const { rows } = await pool.query(
    `select last_run_at from sync_state where source=$1`,
    ['airtable.projects']
  );
  return rows[0]?.last_run_at as Date | undefined;
}

export async function setLastRun(ts = new Date()) {
  await pool.query(
    `insert into sync_state(source, last_run_at)
     values($1,$2)
     on conflict(source) do update set last_run_at=excluded.last_run_at`,
    ['airtable.projects', ts]
  );
}
