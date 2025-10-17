import 'dotenv/config';
import { PoolClient } from 'pg';
import { pool } from './pg.js';
import { ingestSourceX } from './ingest.js';
import { getSecureParameter } from './ssm.js';

type SourceRecord = {
  id: string;
  status: string;
  secret_ref: string;
};

async function loadSource(client: PoolClient, sourceId: string): Promise<SourceRecord> {
  const { rows } = await client.query<SourceRecord>(
    `select s.id, s.status, ss.secret_ref
       from sources s
       join source_secrets ss on ss.source_id = s.id
      where s.id = $1
      for update`,
    [sourceId],
  );

  if (!rows.length) {
    throw new Error('source not found');
  }

  return rows[0];
}

async function run(sourceId: string) {
  const client = await pool.connect();
  try {
    const source = await loadSource(client, sourceId);
    const token = await getSecureParameter(source.secret_ref);
    if (!token) {
      throw new Error('token not found');
    }

    const start = new Date();

    await client.query('begin');
    try {
      await client.query(
        `update sources set status = 'connecting', updated_at = now() where id = $1`,
        [sourceId],
      );

      const ingested = await ingestSourceX(client, sourceId, token);

      const finished = new Date();
      await client.query(
        `update sources
            set status = 'active',
                last_sync_at = $2,
                updated_at = now()
          where id = $1`,
        [sourceId, finished],
      );
      await client.query(
        `insert into source_syncs(source_id, started_at, finished_at, ok, items_ingested)
         values ($1, $2, $3, true, $4)`,
        [sourceId, start, finished, ingested],
      );

      await client.query('commit');
      console.log(`Ingested ${ingested} items for ${sourceId}`);
    } catch (error) {
      await client.query('rollback');

      const finished = new Date();
      await client.query('begin');
      await client.query(
        `insert into source_syncs(source_id, started_at, finished_at, ok, error)
         values ($1, $2, $3, false, $4)`,
        [sourceId, start, finished, String((error as Error)?.message ?? error)],
      );
      await client.query(
        `update sources
            set status = 'error',
                updated_at = now()
          where id = $1`,
        [sourceId],
      );
      await client.query('commit');

      throw error;
    }
  } finally {
    client.release();
  }
}

const sourceId = process.env.SOURCE_ID;
if (!sourceId) {
  console.error('SOURCE_ID env required');
  process.exit(1);
}

run(sourceId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
