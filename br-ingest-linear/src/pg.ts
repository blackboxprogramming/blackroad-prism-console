import { Pool } from 'pg';

const connectionString = process.env.PG_URL;

if (!connectionString) {
  throw new Error('PG_URL is required');
}

export const pool = new Pool({
  connectionString,
  application_name: 'br-ingest-linear',
});
