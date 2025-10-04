import 'dotenv/config';
import { PoolClient } from 'pg';
import { pool } from './pg.js';
import { getSecret } from './ssm.js';
import { iterIssues, LinearIssue } from './linear.js';

const sourceIdEnv = process.env.SOURCE_ID;
const tokenParamEnv = process.env.LINEAR_TOKEN_PARAM;

if (!sourceIdEnv) throw new Error('SOURCE_ID is required');
if (!tokenParamEnv) throw new Error('LINEAR_TOKEN_PARAM is required');

const SOURCE_ID = sourceIdEnv;
const TOKEN_PARAM = tokenParamEnv;

async function getToken(): Promise<string> {
  return getSecret(TOKEN_PARAM);
}

async function upsertIssues(client: PoolClient, items: LinearIssue[], teamKey: string, sourceId: string) {
  if (!items.length) return 0;
  const values: any[] = [];
  const rows = items
    .map((item, idx) => {
      const base = idx * 17;
      const labels = item.labels?.nodes?.map((n) => ({ name: n?.name ?? null })) ?? [];
      values.push(
        item.identifier,
        item.number,
        teamKey,
        item.team?.name ?? null,
        item.project?.name ?? null,
        item.title,
        item.description ?? null,
        item.state?.name ?? null,
        item.priority ?? null,
        item.estimate ?? null,
        JSON.stringify(labels),
        item.assignee?.name ?? null,
        item.createdAt,
        item.updatedAt,
        item.completedAt ?? null,
        JSON.stringify(item),
        sourceId,
      );
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},$${base + 12},$${base + 13},$${base + 14},$${base + 15},$${base + 16},$${base + 17})`;
    })
    .join(',');

  await client.query(
    `INSERT INTO raw_linear_issues(
      id, number, team_key, team_name, project_name,
      title, description, state, priority, estimate, labels, assignee,
      created_at, updated_at, completed_at, payload, source_id
    ) VALUES ${rows}
    ON CONFLICT (id) DO UPDATE SET
      number = EXCLUDED.number,
      team_key = EXCLUDED.team_key,
      team_name = EXCLUDED.team_name,
      project_name = EXCLUDED.project_name,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      state = EXCLUDED.state,
      priority = EXCLUDED.priority,
      estimate = EXCLUDED.estimate,
      labels = EXCLUDED.labels,
      assignee = EXCLUDED.assignee,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at,
      completed_at = EXCLUDED.completed_at,
      payload = EXCLUDED.payload,
      source_id = EXCLUDED.source_id`,
    values,
  );
  return items.length;
}

async function processTeam(client: PoolClient, token: string, sourceId: string, teamKey: string, sinceISO: string) {
  let total = 0;
  for await (const batch of iterIssues(token, teamKey, sinceISO)) {
    total += await upsertIssues(client, batch, teamKey, sourceId);
  }
  const { rows } = await client.query(
    `SELECT MAX(updated_at) AS max_updated FROM raw_linear_issues WHERE team_key = $1`,
    [teamKey],
  );
  const nextSince = rows[0]?.max_updated || new Date().toISOString();
  await client.query(
    `UPDATE linear_team_sync SET last_updated_at = $1 WHERE source_id = $2 AND team_key = $3`,
    [nextSince, sourceId, teamKey],
  );
  console.log(`Team ${teamKey}: +${total} issues`);
}

async function main() {
  const token = await getToken();
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT team_key, last_updated_at FROM linear_team_sync WHERE source_id = $1`,
      [SOURCE_ID],
    );
    if (!rows.length) throw new Error('No teams configured for source');

    for (const row of rows) {
      const teamKey = row.team_key as string;
      const since = new Date(row.last_updated_at).toISOString();
      await processTeam(client, token, SOURCE_ID, teamKey, since);
    }
  } finally {
    client.release();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
