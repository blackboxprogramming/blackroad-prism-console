import { Pool, PoolConfig, QueryResult } from 'pg';

let pool: Pool | undefined;

function getConfig(): PoolConfig {
  const connectionString = process.env.PG_URL;
  if (!connectionString) {
    throw new Error('PG_URL is not configured');
  }
  const config: PoolConfig = {
    connectionString,
    application_name: 'prism-api',
  };
  if (process.env.PG_POOL_MAX) {
    const max = Number(process.env.PG_POOL_MAX);
    if (!Number.isNaN(max) && max > 0) {
      config.max = max;
    }
  }
  if (process.env.PG_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false } as any;
  }
  return config;
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool(getConfig());
  }
  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
  const p = getPool();
  return p.query<T>(sql, params);
}

export { getPool as pool };
