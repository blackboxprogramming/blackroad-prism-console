import { FastifyInstance, FastifyRequest } from 'fastify';
import crypto from 'node:crypto';
import { ssm } from '../util/ssm.js';
import { db } from '../util/db.js';

type GitHubWebhookBody = {
  repository?: { owner?: { login?: string }; name?: string };
  issue?: {
    id: number;
    number: number;
    title: string;
    state: string;
    labels?: Array<{ name?: string; [k: string]: unknown }>;
    user?: { login?: string } | null;
    created_at: string;
    closed_at?: string | null;
    updated_at: string;
  };
  [k: string]: unknown;
};

function verify(sigHeader: string | undefined, secret: string, payload: Buffer) {
  if (!sigHeader?.startsWith('sha256=')) return false;
  const sig = sigHeader.slice(7);
  const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(digest, 'hex'));
  } catch {
    return false;
  }
}

function resolveEnv(req: FastifyRequest) {
  const header = (req.headers['x-blackroad-env'] || req.headers['x-env'] || req.headers['x-app-env']) as string | undefined;
  return header || process.env.BLACKROAD_ENV || process.env.NODE_ENV || 'dev';
}

function getRawBody(req: FastifyRequest): Buffer | null {
  const raw = (req as any).rawBody as Buffer | undefined;
  if (raw && Buffer.isBuffer(raw)) return raw;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (req.body && typeof req.body === 'object') return Buffer.from(JSON.stringify(req.body));
  return null;
}

async function upsertIssue(body: GitHubWebhookBody) {
  const repoOwner = body.repository?.owner?.login;
  const repoName = body.repository?.name;
  const issue = body.issue;
  if (!repoOwner || !repoName || !issue) return;
  const repoFull = `${repoOwner}/${repoName}`;
  await db.query(
    `insert into raw_github_issues(
       id, repo_full, number, title, state, is_pull, labels, author,
       created_at, closed_at, updated_at, payload
     ) values ($1,$2,$3,$4,$5,false,$6,$7,$8,$9,$10,$11)
     on conflict (id) do update set
       repo_full=excluded.repo_full,
       title=excluded.title,
       state=excluded.state,
       labels=excluded.labels,
       author=excluded.author,
       created_at=excluded.created_at,
       closed_at=excluded.closed_at,
       updated_at=excluded.updated_at,
       payload=excluded.payload`,
    [
      issue.id,
      repoFull,
      issue.number,
      issue.title,
      issue.state,
      JSON.stringify(issue.labels ?? []),
      issue.user?.login ?? null,
      issue.created_at,
      issue.closed_at ?? null,
      issue.updated_at,
      JSON.stringify(issue)
    ]
  );
}

export default async function (app: FastifyInstance) {
  app.post('/webhooks/github', async (req, reply) => {
    const env = resolveEnv(req);
    const secret = await ssm.get(`/blackroad/${env}/github/webhook_secret`);
    const rawBody = getRawBody(req);
    if (!rawBody) {
      req.log.warn('github webhook: missing raw body');
      return reply.code(400).send({ error: 'invalid body' });
    }
    const ok = verify(req.headers['x-hub-signature-256'] as string | undefined, secret, rawBody);
    if (!ok) {
      req.log.warn('github webhook: signature mismatch');
      return reply.code(401).send({ error: 'bad signature' });
    }

    const event = req.headers['x-github-event'];
    const payload = req.body as GitHubWebhookBody;

    if (event === 'issues' || event === 'issue_comment') {
      try {
        await upsertIssue(payload);
      } catch (err) {
        req.log.error({ err }, 'github webhook upsert failed');
        return reply.code(500).send({ error: 'db_error' });
      }
    }

    return reply.code(200).send({ ok: true });
  });
}
