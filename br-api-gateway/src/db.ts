import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

function createPool() {
  const connectionString = process.env.PG_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('PG_URL (or DATABASE_URL) must be set for database access');
  }
  return new Pool({ connectionString, application_name: 'br-api-gateway' });
}

export function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
