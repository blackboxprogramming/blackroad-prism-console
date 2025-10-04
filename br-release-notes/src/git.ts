import fetch from 'node-fetch';

export interface Commit {
  sha: string;
  commit: {
    message: string;
  };
}

export interface GetCommitsParams {
  owner: string;
  repo: string;
  base: string;
  head: string;
  token: string;
}

export async function getCommits({ owner, repo, base, head, token }: GetCommitsParams): Promise<Commit[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/compare/${base}...${head}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'BlackRoad-Release-Notes',
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub compare ${response.status}`);
  }

  const body = (await response.json()) as { commits?: Commit[] };
  return body.commits ?? [];
}

export function groupConventional(commits: Commit[]) {
  const groups: Record<string, { sha: string; msg: string }[]> = {
    feat: [],
    fix: [],
    chore: [],
    docs: [],
    refactor: [],
    other: [],
  };

  for (const commit of commits) {
    const message = (commit.commit?.message ?? '').split('\n')[0];
    const match = /^(\w+)(?:\([\w\-]+\))?\:/i.exec(message);
    const key = match?.[1]?.toLowerCase() ?? 'other';
    const bucket = Object.prototype.hasOwnProperty.call(groups, key) ? key : 'other';
    groups[bucket].push({ sha: commit.sha, msg: message });
  }

  return groups;
}

export function extractReleaseBullets(prBodies: string[]) {
  const bullets: string[] = [];

  for (const body of prBodies) {
    const match = body.match(/##\s*Release note[^\n]*\n([\s\S]*?)(?:\n##|$)/i);
    if (!match) continue;

    const section = match[1];
    const lines = section.split(/\r?\n/);
    for (const line of lines) {
      const bulletMatch = /^[-*]\s+(.*)/.exec(line.trim());
      if (bulletMatch) {
        bullets.push(bulletMatch[1].trim());
      }
    }
  }

  return bullets.filter(Boolean).slice(0, 3);
}

export interface GetPullRequestBodiesParams {
  owner: string;
  repo: string;
  shas: string[];
  token: string;
}

export async function getPullRequestBodies({ owner, repo, shas, token }: GetPullRequestBodiesParams): Promise<string[]> {
  const bodies: string[] = [];
  const seen = new Set<number>();

  for (const sha of shas) {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}/pulls`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'BlackRoad-Release-Notes',
        Accept: 'application/vnd.github.groot-preview+json',
      },
    });

    if (!response.ok) {
      continue;
    }

    const prs = (await response.json()) as { number: number; body?: string }[];
    for (const pr of prs) {
      if (seen.has(pr.number) || !pr.body) continue;
      seen.add(pr.number);
      bodies.push(pr.body);
    }
  }

  // Fallback: extract PR numbers from commit messages like "(#123)"
  for (const sha of shas) {
    const commit = shasToMessages.get(sha);
    if (!commit) continue;
    const matches = commit.match(/\(#(\d+)\)/g) ?? [];
    for (const entry of matches) {
      const num = Number(entry.replace(/[^0-9]/g, ''));
      if (!num || seen.has(num)) continue;
      try {
        const pr = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${num}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': 'BlackRoad-Release-Notes',
            Accept: 'application/vnd.github+json',
          },
        });
        if (!pr.ok) continue;
        const body = (await pr.json()) as { body?: string };
        if (body.body) {
          seen.add(num);
          bodies.push(body.body);
        }
      } catch {
        // ignore
      }
    }
  }

  return bodies;
}

const shasToMessages = new Map<string, string>();

export function cacheCommitMessages(commits: Commit[]) {
  shasToMessages.clear();
  for (const commit of commits) {
    shasToMessages.set(commit.sha, commit.commit?.message ?? '');
  }
}
