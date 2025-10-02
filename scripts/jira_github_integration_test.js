#!/usr/bin/env node
/**
 * Jira ↔ GitHub integration test script.
 * Usage: node scripts/jira_github_integration_test.js
 * Requires environment variables: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN,
 * JIRA_PROJECT_KEY, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, optional CLEANUP=true.
 */

const {
  JIRA_BASE_URL,
  JIRA_EMAIL,
  JIRA_API_TOKEN,
  JIRA_PROJECT_KEY,
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  CLEANUP,
} = process.env;

const required = [
  'JIRA_BASE_URL',
  'JIRA_EMAIL',
  'JIRA_API_TOKEN',
  'JIRA_PROJECT_KEY',
  'GITHUB_TOKEN',
  'GITHUB_OWNER',
  'GITHUB_REPO',
];

function missingEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('Missing environment variables:', missing.join(', '));
    console.error('Please set them before running this script.');
    process.exit(1);
  }
}

const jiraAuth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

async function fetchJson(url, options = {}, service) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (service === 'jira') headers.Authorization = `Basic ${jiraAuth}`;
  if (service === 'github') {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    headers.Accept = 'application/vnd.github+json';
    headers['User-Agent'] = 'jira-github-integration-test-script';
  }

  const max = 3;
  for (let attempt = 0; attempt < max; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, { ...options, headers, signal: controller.signal });
      if (res.status === 429 || res.status >= 500) {
        const wait = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) {
        const text = await res.text();
        const error = new Error(`${service} ${res.status}: ${text.slice(0, 200)}`);
        error.status = res.status;
        error.service = service;
        error.body = text.slice(0, 200);
        throw error;
      }
      return res.status === 204 ? null : await res.json();
    } catch (err) {
      if (
        attempt === max - 1 ||
        !(
          err.status === 429 ||
          err.status >= 500 ||
          err.name === 'AbortError'
        )
      )
        throw err;
      const wait = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, wait));
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function step(name, fn) {
  try {
    return await fn();
  } catch (e) {
    console.error(`FAIL ${name}: ${e.message}`);
    throw e;
  }
}

(async () => {
  missingEnv();
  const timestamp = new Date().toISOString();
  let issueKey, browseUrl, ghNumber, ghUrl;

  try {
    await step('Jira auth', async () => {
      const data = await fetchJson(`${JIRA_BASE_URL}/rest/api/3/myself`, {}, 'jira');
      console.log(`PASS Jira auth: accountId ${data.accountId} displayName ${data.displayName}`);
      return data;
    });

    await step('Create Jira issue', async () => {
      const payload = {
        fields: {
          project: { key: JIRA_PROJECT_KEY },
          summary: `Integration Test: Jira ↔ GitHub (${timestamp})`,
          issuetype: { name: 'Task' },
          description: `Automated test created at ${timestamp}`,
        },
      };
      const issue = await fetchJson(
        `${JIRA_BASE_URL}/rest/api/3/issue`,
        { method: 'POST', body: JSON.stringify(payload) },
        'jira'
      );
      issueKey = issue.key;
      browseUrl = `${JIRA_BASE_URL}/browse/${issueKey}`;
      console.log(`PASS Jira issue created: ${issueKey} ${browseUrl}`);
    });

    await step('Create GitHub issue', async () => {
      const payload = {
        title: `Integration Test: Jira ↔ GitHub (${timestamp})`,
        body: `Related Jira: ${browseUrl}\n\nCreated by automated test.`,
      };
      const issue = await fetchJson(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
        { method: 'POST', body: JSON.stringify(payload) },
        'github'
      );
      ghNumber = issue.number;
      ghUrl = issue.html_url;
      console.log(`PASS GitHub issue created: #${ghNumber} ${ghUrl}`);
    });

    await step('Add Jira remote link', async () => {
      const payload = {
        object: {
          url: ghUrl,
          title: `GitHub Issue #${ghNumber}`,
          icon: { url16x16: 'https://github.githubassets.com/favicons/favicon.png' },
          status: { resolved: false },
        },
      };
      await fetchJson(
        `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/remotelink`,
        { method: 'POST', body: JSON.stringify(payload) },
        'jira'
      );
      console.log('PASS Jira remote link added');
    });

    await step('Add Jira comment', async () => {
      const payload = { body: `Linked GitHub issue: ${ghUrl}` };
      await fetchJson(
        `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/comment`,
        { method: 'POST', body: JSON.stringify(payload) },
        'jira'
      );
      console.log('PASS Jira comment added');
    });

    if (CLEANUP === 'true') {
      let cleanOk = true;
      await step('Cleanup GitHub issue', async () => {
        await fetchJson(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${ghNumber}`,
          { method: 'PATCH', body: JSON.stringify({ state: 'closed' }) },
          'github'
        );
        console.log('PASS Cleanup GitHub issue closed');
      }).catch(() => (cleanOk = false));

      await step('Cleanup Jira issue', async () => {
        try {
          await fetchJson(
            `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}?deleteSubtasks=true`,
            { method: 'DELETE' },
            'jira'
          );
          console.log('PASS Cleanup Jira issue deleted');
        } catch (e) {
          if (e.status === 403) {
            console.log('SKIP Cleanup Jira issue delete: forbidden');
          } else {
            throw e;
          }
        }
      }).catch(() => (cleanOk = false));

      if (!cleanOk) throw new Error('Cleanup failed');
    }

    console.log('PASS All steps completed');
  } catch (err) {
    console.error('Integration test failed');
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
})();

