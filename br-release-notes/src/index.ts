import { writeFileSync } from 'node:fs';
import { getCommits, groupConventional, extractReleaseBullets, getPullRequestBodies, cacheCommitMessages } from './git.js';
import { loadIncidents, type Incident } from './incidents.js';
import { renderTemplate, type TemplateKind } from './render.js';

async function main() {
  const {
    GITHUB_TOKEN,
    REPO_OWNER,
    REPO_NAME,
    BASE_REF,
    HEAD_REF,
    RELEASE_KIND = 'api',
    COMPARE_URL,
    INCIDENTS_DIR = '../br-status-site/content/issues',
    NEXT_VERSION = '0.1.0',
    WINDOW_FROM,
    WINDOW_TO,
  } = process.env;

  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN required');
  if (!REPO_OWNER) throw new Error('REPO_OWNER required');
  if (!REPO_NAME) throw new Error('REPO_NAME required');
  if (!BASE_REF) throw new Error('BASE_REF required');
  if (!HEAD_REF) throw new Error('HEAD_REF required');

  const commits = await getCommits({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    base: BASE_REF,
    head: HEAD_REF,
    token: GITHUB_TOKEN,
  });

  cacheCommitMessages(commits);

  const groups = groupConventional(commits);
  const prBodies = await getPullRequestBodies({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    shas: commits.map((commit) => commit.sha),
    token: GITHUB_TOKEN,
  });
  const bullets = extractReleaseBullets(prBodies);

  const now = new Date();
  const fromISO = WINDOW_FROM ?? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const toISO = WINDOW_TO ?? now.toISOString();

  let incidents: Incident[] = [];
  try {
    incidents = loadIncidents({ issuesDir: INCIDENTS_DIR, fromISO, toISO });
  } catch (error) {
    console.warn('Unable to load incidents', error);
  }

  const body = renderTemplate(RELEASE_KIND as TemplateKind, {
    version: NEXT_VERSION,
    date: now,
    compareUrl:
      COMPARE_URL ?? `https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/${BASE_REF}...${HEAD_REF}`,
    bullets,
    groups,
    incidents,
  });

  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `body<<EOF\n${body}\nEOF\n`, { flag: 'a' });
  }

  console.log(body);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
