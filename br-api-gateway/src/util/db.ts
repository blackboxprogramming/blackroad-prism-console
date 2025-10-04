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
