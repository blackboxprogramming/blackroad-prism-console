import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.PG_URL,
  application_name: 'br-ingest-snowpipe'
});

export async function getWatermark(source: string) {
  const { rows } = await pool.query('select last_run_at from sync_state where source=$1', [source]);
  return rows[0]?.last_run_at ? new Date(rows[0].last_run_at) : new Date(0);
}

export async function setWatermark(source: string, ts: Date) {
  await pool.query(
    `
    insert into sync_state(source, last_run_at) values ($1,$2)
    on conflict (source) do update set last_run_at=excluded.last_run_at`,
    [source, ts]
  );
}
