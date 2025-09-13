// Usage: node scripts/discord-github-test.js
// Verifies a Discord webhook and GitHub issue integration end-to-end.

const requiredEnv = [
  'DISCORD_WEBHOOK_ID',
  'DISCORD_WEBHOOK_TOKEN',
  'DISCORD_GUILD_ID',
  'GITHUB_TOKEN',
  'GITHUB_OWNER',
  'GITHUB_REPO'
];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing environment variables: ' + missing.join(', '));
  console.error('Please set them and re-run.');
  process.exit(1);
}

const {
  DISCORD_WEBHOOK_ID,
  DISCORD_WEBHOOK_TOKEN,
  DISCORD_GUILD_ID,
  GITHUB_TOKEN,
  GITHUB_OWNER,
  GITHUB_REPO,
  CLEANUP
} = process.env;

const timestamp = new Date().toISOString();
const discordBase = `https://discord.com/api/webhooks/${DISCORD_WEBHOOK_ID}/${DISCORD_WEBHOOK_TOKEN}`;
const githubBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
const baseContent = `Integration Test: Discord ↔ GitHub (${timestamp})\nCreated by automated test.`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}, service) {
  const headers = {
    'Content-Type': 'application/json',
    ...(service === 'github'
      ? {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'discord-github-test-script'
        }
      : {}),
    ...options.headers
  };
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await sleep(Math.pow(2, attempt) * 1000 + Math.random() * 1000);
      continue;
    }
    if (res.status === 204) return null;
    if (res.ok) {
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt === maxAttempts) {
        const snippet = (await res.text()).slice(0, 200);
        throw new Error(`${service} ${res.status}: ${snippet}`);
      }
      const retryAfter = res.headers.get('Retry-After');
      let delay = retryAfter ? Number(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
      delay += Math.random() * 1000;
      await sleep(delay);
      continue;
    }
    const snippet = (await res.text()).slice(0, 200);
    throw new Error(`${service} ${res.status}: ${snippet}`);
  }
}

async function cleanupArtifacts(discordUrl, messageId, issueNumber) {
  let failed = false;
  try {
    await fetchJson(`${githubBase}/issues/${issueNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed' })
    }, 'github');
    console.log('PASS GitHub issue closed');
  } catch (err) {
    console.error(`FAIL closing GitHub issue: ${err.message}`);
    failed = true;
  }
  try {
    await fetchJson(`${discordUrl}/messages/${messageId}`, { method: 'DELETE' }, 'discord');
    console.log('PASS Discord message deleted');
  } catch (err) {
    console.error(`FAIL deleting Discord message: ${err.message}`);
    failed = true;
  }
  return failed;
}

(async () => {
  let messageId, channelId, jumpLink;
  let issueNumber, issueUrl;
  try {
    const msg = await fetchJson(`${discordBase}?wait=true`, {
      method: 'POST',
      body: JSON.stringify({ content: baseContent })
    }, 'discord');
    if (!msg || !msg.id || !msg.channel_id) {
      throw new Error('Discord webhook did not return expected message metadata. Ensure ?wait=true.');
    }
    messageId = msg.id;
    channelId = msg.channel_id;
    jumpLink = `https://discord.com/channels/${DISCORD_GUILD_ID}/${channelId}/${messageId}`;
    console.log(`PASS Discord message created: ${jumpLink}`);
  } catch (err) {
    console.error(`FAIL Discord message creation: ${err.message}`);
    process.exit(1);
  }

  try {
    const issue = await fetchJson(`${githubBase}/issues`, {
      method: 'POST',
      body: JSON.stringify({
        title: `Integration Test: Discord ↔ GitHub (${timestamp})`,
        body: `Related Discord message: ${jumpLink}\n\nCreated by automated test.`
      })
    }, 'github');
    issueNumber = issue.number;
    issueUrl = issue.html_url;
    console.log(`PASS GitHub issue created: #${issueNumber} ${issueUrl}`);
  } catch (err) {
    console.error(`FAIL GitHub issue creation: ${err.message}`);
    process.exit(1);
  }

  try {
    await fetchJson(`${discordBase}/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content: `${baseContent}\nGitHub issue: ${issueUrl}` })
    }, 'discord');
    console.log('PASS Discord message updated with GitHub link');
  } catch (err) {
    console.error(`FAIL Discord message update: ${err.message}`);
    process.exit(1);
  }

  if (CLEANUP === 'true') {
    const failed = await cleanupArtifacts(discordBase, messageId, issueNumber);
    if (failed) process.exit(1);
  } else {
    console.log('SKIP cleanup: set CLEANUP=true to remove artifacts');
  }

  console.log('PASS all steps completed');
  process.exit(0);
})().catch((err) => {
  console.error(`FAIL unexpected error: ${err.message}`);
  process.exit(1);
});

