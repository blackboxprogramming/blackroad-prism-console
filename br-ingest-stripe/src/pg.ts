import { Pool } from 'pg';

if (!process.env.PG_URL) {
  throw new Error('PG_URL is required');
}

export const pool = new Pool({
  connectionString: process.env.PG_URL,
  application_name: 'br-ingest-stripe',
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
