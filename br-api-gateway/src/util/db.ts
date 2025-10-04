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
