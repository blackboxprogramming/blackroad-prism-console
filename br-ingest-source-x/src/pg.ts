import { Pool } from 'pg';

const connectionString = process.env.PG_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[br-ingest-source-x] PG_URL not provided');
}

export const pool = new Pool({
  connectionString,
  application_name: 'br-ingest-source-x',
});
