import 'dotenv/config';
import { pool } from './pg.js';
import { getParam } from './ssm.js';
import { ingestRepo } from './ingest.js';

async function main() {
  const SOURCE_ID = process.env.SOURCE_ID!;
  const tokenParam = process.env.GH_TOKEN_PARAM!;
  const token = await getParam(tokenParam);
  if (!token) throw new Error('Missing GitHub token param/secret');

  const client = await pool.connect();
  try {
    // which repos + watermark?
    const { rows } = await client.query(
      `select r.repo_full, coalesce(r.last_updated_at, '1970-01-01') as since
       from github_repo_sync r where r.source_id = $1`, [SOURCE_ID]);
    if (!rows.length) throw new Error('No repos configured');

    for (const row of rows) {
      const repo = row.repo_full as string;
      const sinceISO = new Date(row.since).toISOString();
      const n = await ingestRepo(client, repo, sinceISO, token);
      const maxUpdated = await client.query(`select max(updated_at) m from raw_github_issues where repo_full=$1`, [repo]);
      const nextSince = maxUpdated.rows[0]?.m || new Date().toISOString();
      await client.query(`update github_repo_sync set last_updated_at=$1 where source_id=$2 and repo_full=$3`,
        [nextSince, SOURCE_ID, repo]);
      console.log(`Repo ${repo}: +${n} issues`);
    }
  } finally {
    client.release();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
