import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import fetch from 'node-fetch';
import { db } from '../../util/db.js';
import { ssm } from '../../util/ssm.js';
import { runIngestTask } from '../../util/ecs.js';

type SourceRow = {
  id: string;
  kind: string;
  status: string;
  last_sync_at: string | null;
};

type SourceStatusRow = SourceRow & {
  recent: Array<{
    started_at: string | null;
    finished_at: string | null;
    ok: boolean | null;
    items: number | null;
    error: string | null;
  }> | null;
};

export default async function sourcesRoutes(app: FastifyInstance) {
  app.get('/sources', async (req: any, reply) => {
    const orgId: string | undefined = req.org?.id;
    if (!orgId) {
      reply.code(400);
      return { error: 'org context required' };
    }

    const { rows } = await db.query<SourceRow>(
      `select id, kind, status, last_sync_at
         from sources
        where org_id = $1
        order by created_at desc`,
      [orgId],
    );

    return rows;
  });

  app.post('/sources', {
    schema: {
      body: {
        type: 'object',
        required: ['kind', 'token'],
        properties: {
          kind: { type: 'string' },
          token: { type: 'string' },
        },
      },
    },
  }, async (req: any, reply) => {
    const orgId: string | undefined = req.org?.id;
    if (!orgId) {
      reply.code(400);
      return { error: 'org context required' };
    }

    const { kind, token } = req.body as { kind: string; token: string };

    const isValid = await validateToken(kind, token);
    if (!isValid) {
      reply.code(400);
      return { error: 'Invalid token' };
    }

    const sourceId = randomUUID();
    const env = process.env.BR_ENV || process.env.NODE_ENV || 'dev';
    const paramName = `/blackroad/${env}/sources/${sourceId}/token`;

    await db.withTransaction(async (client) => {
      await client.query(
        `insert into sources(id, org_id, kind, status)
         values ($1, $2, $3, 'connecting')`,
        [sourceId, orgId, kind],
      );

      await ssm.put(paramName, token);

      await client.query(
        `insert into source_secrets(source_id, secret_ref)
         values ($1, $2)`,
        [sourceId, paramName],
      );
    });

    await triggerInitialSync(app, sourceId);

    reply.code(201);
    return { id: sourceId, status: 'connecting' };
  });

  app.get('/sources/:id/status', async (req: any, reply) => {
    const orgId: string | undefined = req.org?.id;
    if (!orgId) {
      reply.code(400);
      return { error: 'org context required' };
    }

    const sourceId = req.params.id as string;

    const { rows } = await db.query<SourceStatusRow>(
      `select s.id,
              s.kind,
              s.status,
              s.last_sync_at,
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'started_at', started_at,
                    'finished_at', finished_at,
                    'ok', ok,
                    'items', items_ingested,
                    'error', error
                  )
                  order by started_at desc
                )
                from source_syncs
               where source_id = s.id
               limit 5
              ) as recent
         from sources s
        where s.id = $1
          and s.org_id = $2`,
      [sourceId, orgId],
    );

    if (!rows.length) {
      reply.code(404);
      return { error: 'not found' };
    }

    return rows[0];
  });
}

async function validateToken(kind: string, token: string) {
  if (!token) return false;

  const baseUrl = process.env.SOURCE_X_BASE_URL || 'https://api.source-x.example.com';
  const validateUrl = `${baseUrl}/v1/me`;

  try {
    const response = await fetch(validateUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      return false;
    }
    return response.ok;
  } catch (error) {
    console.error('validateToken error', error);
    return false;
  }
}

async function triggerInitialSync(app: FastifyInstance, sourceId: string) {
  const cluster = process.env.ECS_CLUSTER;
  const taskDefinition = process.env.ECS_TASK_DEFINITION;
  const subnets = (process.env.ECS_SUBNETS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const securityGroups = (process.env.ECS_SECURITY_GROUPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!cluster || !taskDefinition || !subnets.length || !securityGroups.length) {
    app.log.warn({ sourceId }, 'ECS configuration missing; skipping initial sync trigger');
    return;
  }

  try {
    await runIngestTask({
      cluster,
      taskDefinition,
      subnets,
      securityGroups,
      sourceId,
    });
  } catch (error) {
    app.log.error({ err: error, sourceId }, 'failed to trigger ingest task');
  }
}
