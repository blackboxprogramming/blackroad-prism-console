/**
 * Asana ↔ GitHub integration smoke test.
 * Usage: node scripts/asana_github_integration_test.js
 * Requires env vars: ASANA_ACCESS_TOKEN, ASANA_WORKSPACE_ID,
 * ASANA_PROJECT_ID, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, [CLEANUP=true].
 */

const required = [
  'ASANA_ACCESS_TOKEN',
  'ASANA_WORKSPACE_ID',
  'ASANA_PROJECT_ID',
  'GITHUB_TOKEN',
  'GITHUB_OWNER',
  'GITHUB_REPO'
];
const missing = required.filter((v) => !process.env[v]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  console.error(
    'Please set ASANA_ACCESS_TOKEN, ASANA_WORKSPACE_ID, ASANA_PROJECT_ID, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO.'
  );
  process.exit(1);
}

const {
  ASANA_ACCESS_TOKEN,
  ASANA_WORKSPACE_ID,
  ASANA_PROJECT_ID,
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  CLEANUP
} = process.env;

const timestamp = new Date().toISOString();
const taskName = `Integration Test: Asana ↔ GitHub (${timestamp})`;
const taskNotes = `${timestamp}\ncreated by automated test`;

async function fetchJson(url, options = {}, service) {
  const headers = { ...(options.headers || {}) };
  if (service === 'asana') {
    headers.Authorization = `Bearer ${ASANA_ACCESS_TOKEN}`;
    headers['Content-Type'] = 'application/json';
  } else if (service === 'github') {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    headers.Accept = 'application/vnd.github+json';
    headers['Content-Type'] = 'application/json';
  }
  options.headers = headers;

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, options);
    const text = await res.text();
    if (res.ok) {
      try {
        return text ? JSON.parse(text) : {};
      } catch {
        return {};
      }
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = 500 * 2 ** attempt;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`${service} ${res.status}: ${text.slice(0, 200)}`);
  }
  throw new Error(`${service} request failed after retries`);
}

(async () => {
  let taskGid, taskUrl, issueNumber, issueUrl;

  try {
    const me = await fetchJson('https://app.asana.com/api/1.0/users/me', {}, 'asana');
    console.log(`PASS Asana auth: user ${me.data.name}`);
  } catch (e) {
    console.error(`FAIL Asana auth: ${e.message}`);
    process.exit(1);
  }

  try {
    const task = await fetchJson(
      'https://app.asana.com/api/1.0/tasks',
      {
        method: 'POST',
        body: JSON.stringify({
          data: {
            name: taskName,
            projects: [ASANA_PROJECT_ID],
            workspace: ASANA_WORKSPACE_ID,
            notes: taskNotes
          }
        })
      },
      'asana'
    );
    taskGid = task.data.gid;
    const info = await fetchJson(`https://app.asana.com/api/1.0/tasks/${taskGid}`, {}, 'asana');
    taskUrl = info.data.permalink_url;
    console.log(`PASS Task created: ${task.data.name} ${taskUrl}`);
  } catch (e) {
    console.error(`FAIL create task: ${e.message}`);
    process.exit(1);
  }

  try {
    const issue = await fetchJson(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: taskName,
          body: `Asana task: ${taskUrl}`
        })
      },
      'github'
    );
    issueNumber = issue.number;
    issueUrl = issue.html_url;
    console.log(`PASS GitHub issue created: #${issueNumber} ${issueUrl}`);
  } catch (e) {
    console.error(`FAIL create GitHub issue: ${e.message}`);
    process.exit(1);
  }

  try {
    await fetchJson(
      `https://app.asana.com/api/1.0/tasks/${taskGid}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          data: {
            notes: `${taskNotes}\nGitHub issue: ${issueUrl}`
          }
        })
      },
      'asana'
    );
    console.log('PASS Asana task updated with GitHub link');
  } catch (e) {
    console.error(`FAIL update Asana task: ${e.message}`);
    process.exit(1);
  }

  if (CLEANUP === 'true') {
    try {
      await fetchJson(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ state: 'closed' })
        },
        'github'
      );
      console.log('CLEANUP GitHub issue closed');
    } catch (e) {
      console.error(`CLEANUP failed to close GitHub issue: ${e.message}`);
    }
    try {
      await fetchJson(
        `https://app.asana.com/api/1.0/tasks/${taskGid}`,
        { method: 'DELETE' },
        'asana'
      );
      console.log('CLEANUP Asana task deleted');
    } catch (e) {
      console.error(`CLEANUP failed to delete Asana task: ${e.message}`);
    }
  }

  process.exit(0);
})();

