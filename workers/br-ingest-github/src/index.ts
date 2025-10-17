import { Client } from 'pg';
import {
  findSourceById,
  getRepoSince,
  loadRepoSync,
  repoKey,
  saveRepoSync,
  StoredIssue,
  upsertIssuesFile,
  updateSourceRecord,
  readSsmParameter,
} from './store.js';

const USER_AGENT = process.env.GITHUB_USER_AGENT ?? 'BlackRoad-GitHub-Connector/1.0';

interface IngestResult {
  repo: string;
  lastUpdatedAt: string | null;
  count: number;
}

async function main(): Promise<void> {
  const sourceId = process.env.SOURCE_ID;
  if (!sourceId) {
    throw new Error('SOURCE_ID env var is required');
  }
  const source = findSourceById(sourceId);
  if (!source) {
    throw new Error(`Source ${sourceId} not found`);
  }
  if (!source.parameterPath) {
    throw new Error(`Source ${sourceId} is missing parameterPath`);
  }
  const token = await readSsmParameter(source.parameterPath);
  const pgUrl = process.env.PG_URL;
  const client = pgUrl ? new Client({ connectionString: pgUrl }) : null;
  if (client) {
    await client.connect();
  }
  const repoSync = loadRepoSync();
  const updates: Record<string, string> = {};
  try {
    for (const repo of source.repos) {
      const since = getRepoSince(sourceId, repo);
      const result = await ingestRepo({
        repo,
        since,
        token,
        sourceId,
        client,
      });
      if (result.lastUpdatedAt) {
        updates[repo] = result.lastUpdatedAt;
      }
      console.log(
        `[github-ingest] repo=${repo} fetched=${result.count} lastUpdated=${result.lastUpdatedAt ?? 'n/a'}`
      );
    }
    if (Object.keys(updates).length) {
      for (const [repo, iso] of Object.entries(updates)) {
        repoSync[repoKey(sourceId, repo)] = iso;
      }
      saveRepoSync(repoSync);
    }
    updateSourceRecord(sourceId, {
      status: 'connected',
      lastRunAt: new Date().toISOString(),
      lastError: null,
    });
  } catch (err) {
    console.error('[github-ingest] failed', err);
    updateSourceRecord(sourceId, {
      status: 'error',
      lastError: err instanceof Error ? err.message : String(err),
    });
    process.exitCode = 1;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

async function ingestRepo({
  repo,
  since,
  token,
  sourceId,
  client,
}: {
  repo: string;
  since: string;
  token: string;
  sourceId: string;
  client: Client | null;
}): Promise<IngestResult> {
  let url: URL | null = new URL(`https://api.github.com/repos/${repo}/issues`);
  url.searchParams.set('state', 'all');
  url.searchParams.set('since', since);
  url.searchParams.set('per_page', '100');
  url.searchParams.set('sort', 'updated');
  url.searchParams.set('direction', 'asc');

  let maxUpdated: string | null = null;
  let total = 0;

  while (url) {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': USER_AGENT,
        Accept: 'application/vnd.github+json',
      },
    });

    if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
      const reset = Number(response.headers.get('x-ratelimit-reset') ?? 0) * 1000;
      const wait = Math.max(0, reset - Date.now()) + 1000;
      console.warn(`[github-ingest] rate limited, waiting ${wait}ms`);
      await sleep(wait);
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub ${response.status}: ${text}`);
    }

    const items = (await response.json()) as any[];
    const issues = items
      .filter((item) => !item.pull_request)
      .map((item) => mapIssue(item, repo, sourceId));
    total += issues.length;
    await upsertIssues(issues, sourceId, client);
    for (const issue of issues) {
      if (!maxUpdated || new Date(issue.updated_at) > new Date(maxUpdated)) {
        maxUpdated = issue.updated_at;
      }
    }

    const next = parseLinkNext(response.headers.get('link'));
    url = next ? new URL(next) : null;
  }

  return { repo, lastUpdatedAt: maxUpdated, count: total };
}

async function upsertIssues(issues: StoredIssue[], sourceId: string, client: Client | null): Promise<void> {
  if (!issues.length) {
    return;
  }
  upsertIssuesFile(issues);
  if (!client) {
    return;
  }
  const values: any[] = [];
  const rows = issues
    .map((issue, index) => {
      const base = index * 13;
      values.push(
        issue.id,
        issue.repo_full,
        issue.number,
        issue.title,
        issue.state,
        issue.is_pull,
        JSON.stringify(issue.labels ?? []),
        issue.author,
        issue.created_at,
        issue.closed_at,
        issue.updated_at,
        JSON.stringify(issue.payload ?? {}),
        sourceId
      );
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},$${base + 12},$${base + 13})`;
    })
    .join(',');
  const sql = `insert into raw_github_issues (id, repo_full, number, title, state, is_pull, labels, author, created_at, closed_at, updated_at, payload, source_id)
    values ${rows}
    on conflict (id) do update set
      repo_full = excluded.repo_full,
      title = excluded.title,
      state = excluded.state,
      is_pull = excluded.is_pull,
      labels = excluded.labels,
      author = excluded.author,
      created_at = excluded.created_at,
      closed_at = excluded.closed_at,
      updated_at = excluded.updated_at,
      payload = excluded.payload,
      source_id = excluded.source_id`;
  await client.query(sql, values);
}

function mapIssue(item: any, repo: string, sourceId: string): StoredIssue {
  const labels: string[] = Array.isArray(item?.labels)
    ? item.labels
        .map((label: any) =>
          typeof label === 'string' ? label : typeof label?.name === 'string' ? label.name : null
        )
        .filter((label: string | null): label is string => Boolean(label))
    : [];
  return {
    id: Number(item.id ?? item.node_id),
    repo_full: repo,
    number: Number(item.number ?? 0),
    title: String(item.title ?? ''),
    state: String(item.state ?? 'open'),
    is_pull: Boolean(item.pull_request),
    labels,
    author: typeof item?.user?.login === 'string' ? item.user.login : null,
    created_at: item.created_at ?? new Date().toISOString(),
    closed_at: item.closed_at ?? null,
    updated_at: item.updated_at ?? new Date().toISOString(),
    comments: typeof item.comments === 'number' ? item.comments : 0,
    payload: item,
    sourceIds: [sourceId],
  };
}

function parseLinkNext(header: string | null): string | null {
  if (!header) {
    return null;
  }
  const parts = header.split(',');
  for (const part of parts) {
    const [linkPart, relPart] = part.split(';').map((segment) => segment.trim());
    if (relPart === 'rel="next"') {
      const url = linkPart.replace(/^<|>$/g, '');
      return url;
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error('[github-ingest] unrecoverable error', err);
  process.exit(1);
});
