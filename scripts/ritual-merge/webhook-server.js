const express = require('express');
const crypto = require('crypto');

const app = express();

app.use(
  express.json({
    type: '*/*',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

const PORT = process.env.PORT || 3000;
const SECRET = process.env.GH_WEBHOOK_SECRET;
const GH_TOKEN = process.env.GH_TOKEN;
const WORKFLOW_FILE = process.env.RITUAL_WORKFLOW_FILE || 'ritual-merge.yml';
const WORKFLOW_REF = process.env.RITUAL_WORKFLOW_REF || 'main';
const LOG_PREFIX = '[ritual-merge-webhook]';

if (!SECRET) {
  console.warn(`${LOG_PREFIX} GH_WEBHOOK_SECRET is not set; incoming requests will be rejected.`);
}

if (!GH_TOKEN) {
  console.warn(`${LOG_PREFIX} GH_TOKEN is not set; workflow dispatch calls will fail.`);
}

function hasValidSignature(req) {
  if (!SECRET) {
    return false;
  }
  const signature = req.headers['x-hub-signature-256'];
  if (!signature || typeof signature !== 'string') {
    return false;
  }
  const digest = crypto
    .createHmac('sha256', SECRET)
    .update(req.rawBody || Buffer.from(JSON.stringify(req.body)))
    .digest('hex');
  const expected = `sha256=${digest}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch (err) {
    return false;
  }
}

async function dispatchWorkflow({ owner, repo, prNumber, reactor }) {
  if (!GH_TOKEN) {
    throw new Error('GH_TOKEN not configured');
  }

  const endpoint = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const payload = {
    ref: WORKFLOW_REF,
    inputs: {
      pr: String(prNumber),
      reactor,
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'blackroad-ritual-merge',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dispatch failed (${res.status}): ${body}`);
  }
}

app.post('/webhook', async (req, res) => {
  if (!hasValidSignature(req)) {
    console.warn(`${LOG_PREFIX} rejected payload with invalid signature.`);
    return res.status(401).send('invalid signature');
  }

  const event = req.headers['x-github-event'];
  const delivery = req.headers['x-github-delivery'];
  const body = req.body || {};

  if (event !== 'reaction') {
    return res.status(200).send('ignored');
  }

  if (body.action !== 'created') {
    return res.status(200).send('ignored');
  }

  const reaction = body.reaction || {};
  const issue = body.issue || {};
  const repository = body.repository || {};
  const sender = body.sender || {};

  if (reaction.content !== 'rocket') {
    console.log(`${LOG_PREFIX} delivery ${delivery}: non-rocket reaction (${reaction.content}); ignoring.`);
    return res.status(200).send('ignored');
  }

  if (!issue.pull_request) {
    console.log(`${LOG_PREFIX} delivery ${delivery}: reaction not attached to a PR comment; ignoring.`);
    return res.status(200).send('ignored');
  }

  const prNumber = issue.number;
  const owner = repository.owner?.login;
  const repo = repository.name;
  const reactor = sender.login;

  if (!owner || !repo || !prNumber || !reactor) {
    console.error(`${LOG_PREFIX} delivery ${delivery}: missing repository or PR metadata.`);
    return res.status(422).send('missing fields');
  }

  try {
    await dispatchWorkflow({ owner, repo, prNumber, reactor });
    console.log(`${LOG_PREFIX} delivery ${delivery}: dispatched ritual merge for #${prNumber} by @${reactor}.`);
    return res.status(202).send('ritual dispatched');
  } catch (err) {
    console.error(`${LOG_PREFIX} delivery ${delivery}: failed to dispatch workflow`, err);
    return res.status(502).send('dispatch failed');
  }
});

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, workflow: WORKFLOW_FILE, ref: WORKFLOW_REF });
});

app.listen(PORT, () => {
  console.log(`${LOG_PREFIX} listening on port ${PORT}`);
});
