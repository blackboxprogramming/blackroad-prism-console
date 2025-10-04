import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getPool, withClient } from '../../db.js';
import { putSecureParameter } from '../../ssm.js';
import { linearTokenPath, validateLinearToken } from '../../lib/linear.js';
import { resolveRange } from '../../lib/range.js';

const connectSchema = z.object({
  kind: z.literal('linear_key'),
  token: z.string().min(1, 'token is required'),
  teams: z.array(z.string().min(1)).min(1, 'at least one team is required'),
});

const burndownSchema = z.object({
  team: z.string().min(1),
  cycleStart: z.string().min(1),
  cycleEnd: z.string().min(1),
});

function parseQuery<T>(schema: z.ZodType<T>, input: unknown, errorCode = 400): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const err = new Error(parsed.error.flatten().formErrors.join('; ') || 'invalid request');
    (err as any).statusCode = errorCode;
    throw err;
  }
  return parsed.data;
}

async function seedTeamSync(sourceId: string, teams: string[]) {
  if (!teams.length) return;
  const uniqueTeams = Array.from(new Set(teams));
  await withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const values: any[] = [sourceId, ...uniqueTeams];
      const rows = uniqueTeams
        .map((_, idx) => `($1, $${idx + 2}, DEFAULT)`)
        .join(', ');
      await client.query(
        `INSERT INTO linear_team_sync (source_id, team_key, last_updated_at)
         VALUES ${rows}
         ON CONFLICT (source_id, team_key) DO UPDATE SET last_updated_at = EXCLUDED.last_updated_at`,
        values,
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
}

async function upsertSourceRecord(sourceId: string, teams: string[]) {
  const pool = getPool();
  try {
    await pool.query(
      `INSERT INTO prism_sources (id, kind, status, metadata)
       VALUES ($1, 'linear', 'connecting', jsonb_build_object('teams', to_jsonb($2::text[])))
       ON CONFLICT (id) DO UPDATE SET
         status = 'connecting',
         metadata = jsonb_build_object('teams', to_jsonb($2::text[])),
         updated_at = NOW()`,
      [sourceId, teams],
    );
  } catch (error: any) {
    if (error?.code === '42P01') {
      // Table does not exist yet; ignore for now.
      return;
    }
    throw error;
  }
}

async function triggerIngest(sourceId: string) {
  const taskName = process.env.LINEAR_INGEST_TASK_ARN;
  if (!taskName) {
    return;
  }
  // In production this would call ECS RunTask or another orchestrator.
  // For now we simply log so operators can hook this up.
  console.log(`Triggering ingest worker ${taskName} for source ${sourceId}`);
}

export default async function linearRoutes(app: FastifyInstance) {
  app.post('/sources', {
    schema: {
      body: {
        type: 'object',
        required: ['kind', 'token', 'teams'],
        properties: {
          kind: { type: 'string', enum: ['linear_key'] },
          token: { type: 'string' },
          teams: { type: 'array', items: { type: 'string' }, minItems: 1 },
        },
      },
    },
  }, async (req, reply) => {
    const body = parseQuery(connectSchema, req.body);
    const viewer = await validateLinearToken(body.token).catch((error) => {
      req.log.error({ err: error }, 'Linear token validation failed');
      reply.code(401);
      throw new Error('Linear authentication failed');
    });

    const sourceId = randomUUID();
    const env = process.env.BLACKROAD_ENV || process.env.NODE_ENV || 'dev';
    const param = linearTokenPath(env, sourceId);

    await putSecureParameter(param, body.token);
    await upsertSourceRecord(sourceId, body.teams);
    await seedTeamSync(sourceId, body.teams);
    await triggerIngest(sourceId);

    reply.code(201).send({
      id: sourceId,
      kind: 'linear',
      status: 'connecting',
      teams: body.teams,
      viewer,
      tokenParameter: param,
    });
  });

  app.get('/metrics/linear/issues_created', async (req, reply) => {
    let range;
    try {
      range = resolveRange(req.query as any);
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT date_trunc('day', created_at) AS d, COUNT(*) AS c
         FROM raw_linear_issues
        WHERE created_at BETWEEN $1 AND $2
        GROUP BY 1
        ORDER BY 1 ASC`,
      [range.from.toISOString(), range.to.toISOString()],
    );
    return rows.map((row) => ({ t: row.d, v: Number(row.c) }));
  });

  app.get('/metrics/linear/issues_completed', async (req, reply) => {
    let range;
    try {
      range = resolveRange(req.query as any);
    } catch (error: any) {
      reply.code(400);
      return { error: error.message };
    }
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT date_trunc('day', completed_at) AS d, COUNT(*) AS c
         FROM raw_linear_issues
        WHERE completed_at IS NOT NULL
          AND completed_at BETWEEN $1 AND $2
        GROUP BY 1
        ORDER BY 1 ASC`,
      [range.from.toISOString(), range.to.toISOString()],
    );
    return rows.map((row) => ({ t: row.d, v: Number(row.c) }));
  });

  app.get('/metrics/linear/burndown', async (req, reply) => {
    let parsed;
    try {
      parsed = parseQuery(burndownSchema, req.query);
    } catch (error: any) {
      reply.code((error as any).statusCode || 400);
      return { error: error.message };
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `WITH days AS (
         SELECT generate_series($2::timestamptz, $3::timestamptz, '1 day') AS d
       ), opened AS (
         SELECT date_trunc('day', created_at) AS d, COUNT(*) AS c
           FROM raw_linear_issues
          WHERE team_key = $1
            AND created_at BETWEEN $2 AND $3
          GROUP BY 1
       ), done AS (
         SELECT date_trunc('day', completed_at) AS d, COUNT(*) AS c
           FROM raw_linear_issues
          WHERE team_key = $1
            AND completed_at BETWEEN $2 AND $3
          GROUP BY 1
       )
       SELECT days.d,
         COALESCE(SUM(opened.c) OVER (ORDER BY days.d ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0) -
         COALESCE(SUM(done.c)   OVER (ORDER BY days.d ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0) AS remaining
         FROM days
         LEFT JOIN opened ON opened.d = days.d
         LEFT JOIN done   ON done.d   = days.d
         ORDER BY days.d ASC`,
      [parsed.team, parsed.cycleStart, parsed.cycleEnd],
    );
    return rows.map((row) => ({ t: row.d, v: Number(row.remaining) }));
  });
}
