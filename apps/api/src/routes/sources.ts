import { randomUUID } from 'crypto';
import { Router } from 'express';
import {
  enqueueIngestTask,
  getSource,
  insertSource,
  listSources,
  PrismSourceRecord,
  updateRepoSyncTimes,
} from '../lib/prismSourcesStore.js';
import { validateGithubPAT } from '../lib/github.js';
import { putSecureParameter } from '../lib/ssm.js';

function parseRepos(input: unknown): string[] {
  if (typeof input === 'string') {
    return input
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (Array.isArray(input)) {
    return input
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }
  return [];
}

function validateRepoName(repo: string): boolean {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo);
}

function normaliseRepo(repo: string): string {
  return repo.trim();
}

export default function createSourcesRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json({ sources: listSources() });
  });

  router.post('/', async (req, res) => {
    const { kind, token, repos } = req.body ?? {};
    if (kind !== 'github_pat') {
      return res.status(400).json({
        error: 'unsupported_kind',
        message: 'Only github_pat is supported in v1.',
      });
    }
    const repoList = parseRepos(repos).map(normaliseRepo);
    if (!repoList.length) {
      return res.status(400).json({
        error: 'missing_repos',
        message: 'Provide at least one repo in owner/name format.',
      });
    }
    if (repoList.some((repo) => !validateRepoName(repo))) {
      return res.status(400).json({
        error: 'invalid_repo',
        message: 'Repos must use owner/name and contain alphanumeric, dash, underscore or dot characters.',
      });
    }
    const tokenStr = typeof token === 'string' ? token.trim() : '';
    if (!tokenStr) {
      return res.status(400).json({
        error: 'missing_token',
      });
    }

    const validation = await validateGithubPAT(tokenStr);
    if (!validation.ok) {
      return res.status(400).json({
        error: 'token_validation_failed',
        details: validation.error,
      });
    }

    const now = new Date().toISOString();
    const sourceId = randomUUID();
    const env = process.env.BLACKROAD_ENV ?? 'dev';
    const parameterPath = `/blackroad/${env}/sources/${sourceId}/gh_token`;

    await putSecureParameter(parameterPath, tokenStr);

    const record: PrismSourceRecord = {
      id: sourceId,
      kind: 'github_pat',
      status: 'connected',
      repos: repoList,
      parameterPath,
      createdAt: now,
      updatedAt: now,
      lastRunAt: null,
      lastEnqueuedAt: null,
      metadata: validation.login ? { login: validation.login } : undefined,
    };

    const view = insertSource(record);
    const queued = enqueueIngestTask({
      sourceId,
      repos: repoList,
      enqueuedAt: now,
      reason: 'connect',
    }) ?? view;

    res.status(201).json({ source: queued });
  });

  router.post('/:sourceId/resync', (req, res) => {
    const { sourceId } = req.params;
    const existing = getSource(sourceId);
    if (!existing) {
      return res.status(404).json({ error: 'not_found' });
    }
    const now = new Date().toISOString();
    const updated = enqueueIngestTask({
      sourceId,
      repos: existing.repos,
      enqueuedAt: now,
      reason: 'manual',
    });
    res.status(202).json({ ok: true, source: updated ?? listSources().find((s) => s.id === sourceId) });
  });

  router.get('/:sourceId', (req, res) => {
    const { sourceId } = req.params;
    const existing = listSources().find((s) => s.id === sourceId);
    if (!existing) {
      return res.status(404).json({ error: 'not_found' });
    }
    res.json({ source: existing });
  });

  router.post('/:sourceId/repos/:repo/synced', (req, res) => {
    const { sourceId, repo } = req.params;
    const { timestamp } = req.body ?? {};
    const iso = typeof timestamp === 'string' && timestamp ? timestamp : new Date().toISOString();
    const existing = getSource(sourceId);
    if (!existing) {
      return res.status(404).json({ error: 'not_found' });
    }
    if (!existing.repos.includes(repo)) {
      return res.status(400).json({ error: 'repo_not_tracked' });
    }
    updateRepoSyncTimes(sourceId, { [repo]: iso });
    const next = listSources().find((s) => s.id === sourceId);
    res.json({ ok: true, source: next });
  });

  return router;
}
