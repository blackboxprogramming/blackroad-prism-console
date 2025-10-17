import crypto from 'crypto';
import { Router } from 'express';
import { getSecureParameter } from '../lib/ssm.js';
import {
  findSourceIdsForRepo,
  updateRepoSyncForSources,
  updateSource,
} from '../lib/prismSourcesStore.js';
import {
  StoredGithubIssue,
  upsertIssues,
} from '../lib/githubIssuesStore.js';

const router = Router();
const SECRET_PARAM =
  process.env.GITHUB_WEBHOOK_SECRET_PARAM ??
  `/blackroad/${process.env.BLACKROAD_ENV ?? 'dev'}/sources/github/webhook_secret`;

type GithubWebhookPayload = {
  action?: string;
  issue?: any;
  repository?: { full_name?: string };
};

function ensureBuffer(raw: unknown): Buffer {
  if (Buffer.isBuffer(raw)) {
    return raw;
  }
  if (typeof raw === 'string') {
    return Buffer.from(raw);
  }
  return Buffer.from(JSON.stringify(raw ?? {}));
}

function verifySignature(secret: string, header: string | undefined, payload: Buffer): boolean {
  if (!secret) {
    return true;
  }
  if (!header) {
    return false;
  }
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header));
  } catch {
    return false;
  }
}

function buildIssueRecord(issue: any, repoFull: string): StoredGithubIssue {
  const labels: string[] = Array.isArray(issue?.labels)
    ? issue.labels
        .map((label: any) =>
          typeof label === 'string' ? label : typeof label?.name === 'string' ? label.name : null
        )
        .filter((label: string | null): label is string => Boolean(label))
    : [];
  return {
    id: Number(issue.id ?? issue.node_id),
    repo_full: repoFull,
    number: Number(issue.number ?? 0),
    title: String(issue.title ?? ''),
    state: String(issue.state ?? 'open'),
    is_pull: Boolean(issue.pull_request),
    labels,
    author: typeof issue?.user?.login === 'string' ? issue.user.login : null,
    created_at: issue.created_at ?? new Date().toISOString(),
    closed_at: issue.closed_at ?? null,
    updated_at: issue.updated_at ?? new Date().toISOString(),
    comments: typeof issue.comments === 'number' ? issue.comments : 0,
    payload: issue,
    sourceIds: [],
  };
}

router.post('/github', async (req, res) => {
  const rawBody = ensureBuffer((req as any).rawBody ?? req.body);
  const secret = await getSecureParameter(SECRET_PARAM);
  if (secret) {
    const header = req.get('X-Hub-Signature-256');
    if (!verifySignature(secret, header ?? undefined, rawBody)) {
      return res.status(401).json({ error: 'invalid_signature' });
    }
  }

  const event = req.get('X-GitHub-Event') ?? 'unknown';
  if (event === 'ping') {
    return res.json({ ok: true });
  }

  if (!['issues', 'issue_comment', 'label'].includes(event)) {
    return res.status(202).json({ ok: true, ignored: true });
  }

  const payload = (req.body ?? {}) as GithubWebhookPayload;
  const repoFull = payload.repository?.full_name;
  if (!repoFull) {
    return res.status(400).json({ error: 'missing_repo' });
  }

  if (event === 'label') {
    return res.status(202).json({ ok: true, ignored: true });
  }

  if (!payload.issue) {
    return res.status(400).json({ error: 'missing_issue' });
  }

  const record = buildIssueRecord(payload.issue, repoFull);
  if (record.is_pull) {
    return res.status(202).json({ ok: true, ignored: true });
  }
  const sourceIds = findSourceIdsForRepo(repoFull);
  record.sourceIds = sourceIds;
  upsertIssues([record]);
  if (sourceIds.length) {
    updateRepoSyncForSources(sourceIds, repoFull, record.updated_at);
    const nowIso = new Date().toISOString();
    sourceIds.forEach((id) => {
      updateSource(id, { lastRunAt: nowIso });
    });
  }
  return res.status(202).json({ ok: true, issueId: record.id });
});

export default router;
