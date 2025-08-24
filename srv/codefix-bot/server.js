const express = require('express');
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 4100;
const LOG_DIR = '/var/log/codefix-bot';
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || '';

// Ensure log directory exists
fs.mkdirSync(LOG_DIR, { recursive: true });

const app = express();
app.use(express.json());

// Simple in-memory job queue
const jobs = [];
let running = false;

function verifySignature(req) {
  const signature = req.header('X-Hub-Signature-256');
  if (!signature) return false;
  const body = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function runNextJob() {
  if (running) return;
  const job = jobs.shift();
  if (!job) return;
  running = true;

  const logFile = path.join(LOG_DIR, `${job.id}.log`);
  const out = fs.createWriteStream(logFile);

  const args = [job.repo, job.issueId];
  if (job.dryRun) args.push('--dry-run');

  const proc = spawn('/usr/local/bin/codefix-run.sh', args);
  proc.stdout.pipe(out);
  proc.stderr.pipe(out);
  proc.on('close', code => {
    job.status = code === 0 ? 'success' : 'failed';
    job.log = logFile;
    running = false;
    runNextJob();
  });
}

app.post('/api/webhooks/github', (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }
  const event = req.header('X-GitHub-Event');
  const payload = req.body;
  let trigger = false;
  if (event === 'issues') {
    const labels = payload.issue.labels.map(l => l.name);
    trigger = labels.some(l => ['bug', 'fix', 'lint'].includes(l));
  } else if (event === 'issue_comment') {
    trigger = payload.comment.body.includes('@codefix fix this');
  }
  if (trigger) {
    const job = {
      id: Date.now().toString(),
      repo: payload.repository.full_name,
      issueId: payload.issue ? payload.issue.number : payload.issue_number,
      status: 'queued',
      dryRun: false
    };
    jobs.push(job);
    runNextJob();
  }
  res.json({ ok: true });
});

app.post('/api/fix/:repo/:issueId', (req, res) => {
  if (req.header('Authorization') !== `Bearer ${INTERNAL_TOKEN}`) {
    return res.status(403).send('Forbidden');
  }
  const job = {
    id: Date.now().toString(),
    repo: req.params.repo,
    issueId: req.params.issueId,
    status: 'queued',
    dryRun: !!req.query.dry
  };
  jobs.push(job);
  runNextJob();
  res.json({ job });
});

app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

app.get('/admin', (req, res) => {
  res.send(`<!DOCTYPE html>
<html><head><title>CodeFix Jobs</title></head>
<body><h1>Jobs</h1><pre id="jobs"></pre>
<script>
fetch('/api/jobs').then(r=>r.json()).then(j=>{
  document.getElementById('jobs').textContent = JSON.stringify(j, null, 2);
});
</script></body></html>`);
});

app.listen(PORT, () => {
  console.log(`codefix-bot listening on ${PORT}`);
});

module.exports = app;
