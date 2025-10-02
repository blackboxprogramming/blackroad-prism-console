/* FILE: scripts/gitlab_github_integration_test.js
 * Usage: node scripts/gitlab_github_integration_test.js
 * Tests an end-to-end GitLab ↔ GitHub issue linkage.
 */

const requiredEnv = [
  'GITLAB_BASE_URL',
  'GITLAB_TOKEN',
  'GITLAB_PROJECT_PATH',
  'GITHUB_TOKEN',
  'GITHUB_OWNER',
  'GITHUB_REPO'
];

const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  console.error('Please set required variables before running.');
  process.exit(1);
}

const GITLAB_BASE_URL = process.env.GITLAB_BASE_URL.replace(/\/$/, '');
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const GITLAB_PROJECT_PATH = encodeURIComponent(process.env.GITLAB_PROJECT_PATH);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const CLEANUP = String(process.env.CLEANUP).toLowerCase() === 'true';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, options = {}, service) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (service === 'gitlab') headers['PRIVATE-TOKEN'] = GITLAB_TOKEN;
  if (service === 'github') headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  let attempt = 0;
  while (attempt < 3) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) return res.status === 204 ? {} : res.json();
      const body = await res.text().catch(() => '');
      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        const retryAfter =
          res.headers.get('retry-after') || res.headers.get('x-ratelimit-reset');
        const delay = 1000 * 2 ** attempt + Math.random() * 100;
        console.warn(
          `${service} HTTP ${res.status}; backing off ${Math.round(
            delay
          )}ms` + (retryAfter ? ` (rate limit: ${retryAfter})` : '')
        );
        await sleep(delay);
        attempt++;
        continue;
      }
      throw new Error(
        `${service} HTTP ${res.status}: ${body.slice(0, 80)}`
      );
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') err = new Error('request timeout');
      if (attempt < 2) {
        const delay = 1000 * 2 ** attempt + Math.random() * 100;
        console.warn(
          `${service} fetch error: ${err.message}; retrying in ${Math.round(
            delay
          )}ms`
        );
        await sleep(delay);
        attempt++;
      } else {
        throw err;
      }
    }
  }
}

(async () => {
  const ts = new Date().toISOString();
  const glIssueTitle = `Integration Test: GitLab ↔ GitHub (${ts})`;
  let gitlabIssue, githubIssue;

  // 1) Verify GitLab auth
  try {
    const user = await fetchJson(
      `${GITLAB_BASE_URL}/api/v4/user`,
      {},
      'gitlab'
    );
    console.log(`PASS GitLab auth: ${user.username} (${user.id})`);
  } catch (err) {
    console.error(`FAIL GitLab auth: ${err.message}`);
    process.exit(1);
  }

  // 2) Create GitLab issue
  try {
    gitlabIssue = await fetchJson(
      `${GITLAB_BASE_URL}/api/v4/projects/${GITLAB_PROJECT_PATH}/issues`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: glIssueTitle,
          description: `Automated test created at ${ts}`
        })
      },
      'gitlab'
    );
    console.log(
      `PASS GitLab issue created: !${gitlabIssue.iid} ${gitlabIssue.web_url}`
    );
  } catch (err) {
    console.error(`FAIL GitLab issue creation: ${err.message}`);
    process.exit(1);
  }

  // 3) Create GitHub issue
  try {
    githubIssue = await fetchJson(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: glIssueTitle,
          body: `Related GitLab issue: ${gitlabIssue.web_url}\n\nCreated by automated test.`
        })
      },
      'github'
    );
    console.log(
      `PASS GitHub issue created: #${githubIssue.number} ${githubIssue.html_url}`
    );
  } catch (err) {
    console.error(`FAIL GitHub issue creation: ${err.message}`);
    process.exit(1);
  }

  // 4) Comment back on GitLab issue
  try {
    await fetchJson(
      `${GITLAB_BASE_URL}/api/v4/projects/${GITLAB_PROJECT_PATH}/issues/${gitlabIssue.iid}/notes`,
      {
        method: 'POST',
        body: JSON.stringify({
          body: `Linked GitHub issue: ${githubIssue.html_url}`
        })
      },
      'gitlab'
    );
    console.log('PASS GitLab note added');
  } catch (err) {
    console.error(`FAIL GitLab note: ${err.message}`);
    process.exit(1);
  }

  // 5) Cleanup
  if (CLEANUP) {
    try {
      await fetchJson(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${githubIssue.number}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ state: 'closed' })
        },
        'github'
      );
      console.log('PASS GitHub issue closed');
    } catch (err) {
      console.error(`FAIL GitHub issue close: ${err.message}`);
    }
    try {
      await fetchJson(
        `${GITLAB_BASE_URL}/api/v4/projects/${GITLAB_PROJECT_PATH}/issues/${gitlabIssue.iid}`,
        {
          method: 'PUT',
          body: JSON.stringify({ state_event: 'close' })
        },
        'gitlab'
      );
      console.log('PASS GitLab issue closed');
    } catch (err) {
      console.error(`FAIL GitLab issue close: ${err.message}`);
    }
  } else {
    console.log('SKIP GitHub issue close: CLEANUP!=true');
    console.log('SKIP GitLab issue close: CLEANUP!=true');
  }

  console.log('PASS Integration test completed');
})();
