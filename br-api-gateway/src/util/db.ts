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
};
