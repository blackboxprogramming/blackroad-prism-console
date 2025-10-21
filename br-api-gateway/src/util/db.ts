import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL || process.env.PG_URL;

if (!connectionString) {
  console.warn('[db] DATABASE_URL not set; queries will fail at runtime.');
}

const pool = new Pool({
  connectionString,
  application_name: 'br-api-gateway',
});

export const db = {
  query<T extends QueryResultRow = QueryResultRow>(text: string, params?: any[]): Promise<QueryResult<T>> {
    return pool.query<T>(text, params);
  },
  async withTransaction<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('begin');
      const result = await fn(client);
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  },
  async getClient() {
    return pool.connect();
  },
import { Pool, QueryResult } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.PG_URL;
    if (!connectionString) {
      throw new Error('PG_URL env var required for database access');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export const db = {
  async query(text: string, params?: any[]): Promise<QueryResult> {
    const p = getPool();
    return p.query(text, params);
  }
};
import { Pool } from 'pg';

const connectionString = process.env.PG_URL;
const pool = connectionString
  ? new Pool({ connectionString, application_name: 'br-api-gateway' })
  : null;

export const db = {
  query: (text: string, params?: unknown[]) => {
    if (!pool) throw new Error('PG_URL env var required for db client');
    return pool.query(text, params);
  },
};

export type DbClient = typeof db;
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const db = {
  query: (text: string, params?: unknown[]) => pool.query(text, params)
};
