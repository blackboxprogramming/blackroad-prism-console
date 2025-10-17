import { Pool } from 'pg';
export const pool = new Pool({ connectionString: process.env.PG_URL, application_name: 'br-ingest-github' });
