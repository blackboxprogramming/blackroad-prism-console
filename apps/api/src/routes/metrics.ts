import { Router } from 'express';
import { listIssues } from '../lib/githubIssuesStore.js';

const r = Router();

r.get('/', (_req, res) => res.json({ uptime: process.uptime(), ts: Date.now() }));

function parseRepoParam(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  return value.trim().toLowerCase();
}

function parseLookback(param: unknown, fallbackDays = 7): Date {
  if (typeof param === 'string' && param.trim()) {
    const isoCandidate = new Date(param);
    if (!Number.isNaN(isoCandidate.getTime())) {
      return isoCandidate;
    }
    const periodMatch = param.match(/^-P(\d+)D$/);
    if (periodMatch) {
      const days = Number(periodMatch[1]);
      const now = Date.now();
      return new Date(now - days * 24 * 60 * 60 * 1000);
    }
  }
  const now = Date.now();
  return new Date(now - fallbackDays * 24 * 60 * 60 * 1000);
}

function bucketByDay(records: { timestamp: string }[]): { t: string; v: number }[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    const date = new Date(record.timestamp);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    const key = date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([t, v]) => ({ t, v }));
}

r.get('/github/issues_opened', (req, res) => {
  const repo = parseRepoParam(req.query.repo);
  const since = parseLookback(req.query.from);
  const issues = listIssues().filter((issue) => {
    if (issue.is_pull) {
      return false;
    }
    if (repo && issue.repo_full.toLowerCase() !== repo) {
      return false;
    }
    const createdAt = new Date(issue.created_at);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= since;
  });
  const points = bucketByDay(
    issues.map((issue) => ({ timestamp: issue.created_at }))
  );
  res.json({ points });
});

r.get('/github/issues_closed', (req, res) => {
  const repo = parseRepoParam(req.query.repo);
  const since = parseLookback(req.query.from);
  const issues = listIssues().filter((issue) => {
    if (issue.is_pull || !issue.closed_at) {
      return false;
    }
    if (repo && issue.repo_full.toLowerCase() !== repo) {
      return false;
    }
    const closedAt = new Date(issue.closed_at);
    return !Number.isNaN(closedAt.getTime()) && closedAt >= since;
  });
  const points = bucketByDay(
    issues.map((issue) => ({ timestamp: issue.closed_at as string }))
  );
  res.json({ points });
});

r.get('/github/open_bugs', (req, res) => {
  const repo = parseRepoParam(req.query.repo);
  const issues = listIssues().filter((issue) => {
    if (issue.is_pull) {
      return false;
    }
    if (repo && issue.repo_full.toLowerCase() !== repo) {
      return false;
    }
    if (issue.state !== 'open') {
      return false;
    }
    return issue.labels.some((label) => label.toLowerCase() === 'bug');
  });
  res.json({ points: [{ t: new Date().toISOString(), v: issues.length }] });
});

export default r;
