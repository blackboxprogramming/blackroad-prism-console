import fs from 'fs';
import { execSync } from 'node:child_process';
import fetch from 'node-fetch';

const Q='data/agents/queue.jsonl', R='data/agents/results.jsonl';
function pop(): any|null {
  if (!fs.existsSync(Q)) return null;
  const lines = fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean);
  if (!lines.length) return null;
  const first = JSON.parse(lines[0]);
  fs.writeFileSync(Q, lines.slice(1).join('\n') + (lines.length>1?'\n':''));
  return first;
}

async function run(task:any){
  const action = String(task.action||'');
  let ok=true, output='';
  try{
    if (action.startsWith('shell:')) {
      output = execSync(action.slice(6), { stdio:'pipe', encoding:'utf-8' });
    } else if (action.startsWith('script:')) {
      const cmd = action.slice(7);
      output = execSync(cmd, { stdio:'pipe', encoding:'utf-8' });
    } else if (action.startsWith('workflow:')) {
      const wf = action.slice(9);
      output = execSync(`gh workflow run "${wf}"`, { stdio:'pipe', encoding:'utf-8' });
    } else if (action.startsWith('http:')) {
      const [method, url] = action.slice(5).split(':',2);
      const res = await fetch(url, { method, headers:{'Content-Type':'application/json'} });
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const Q = 'data/agents/queue.jsonl';
const R = 'data/agents/results.jsonl';
const PROTECTED_INTENTS = new Set(['deploy', 'schema:migrate', 'rotate:secrets']);

function pop(): any | null {
  if (!fs.existsSync(Q)) return null;
  const lines = fs.readFileSync(Q, 'utf-8').trim().split('\n').filter(Boolean);
  if (!lines.length) return null;
  const first = JSON.parse(lines[0]);
  fs.writeFileSync(Q, lines.slice(1).join('\n') + (lines.length > 1 ? '\n' : ''));
  return first;
}

async function downloadApprovalBundle(runId: number) {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!repo) throw new Error('missing repository context');
  if (!token) throw new Error('missing github token');

  const headers = {
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    Accept: 'application/vnd.github+json',
  };

  const listRes = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}/artifacts`, {
    headers,
  });
  if (!listRes.ok) {
    throw new Error(`failed to list approval artifacts: ${listRes.status}`);
  }
  const data: any = await listRes.json();
  const artifact = (data?.artifacts || []).find(
    (item: any) => item?.name === 'approval-token' && !item?.expired
  );
  if (!artifact) {
    throw new Error('approval artifact not found');
  }

  const downloadRes = await fetch(artifact.archive_download_url, { headers });
  if (!downloadRes.ok) {
    throw new Error(`failed to download approval artifact: ${downloadRes.status}`);
  }
  const arrayBuffer = await downloadRes.arrayBuffer();
  const zipPath = path.join(os.tmpdir(), `approval-${artifact.id}.zip`);
  fs.writeFileSync(zipPath, Buffer.from(arrayBuffer));

  try {
    const approvalToken = execSync(`unzip -p ${zipPath} approval.token`, {
      encoding: 'utf-8',
    }).trim();
    const approvalSignature = execSync(`unzip -p ${zipPath} approval.signature`, {
      encoding: 'utf-8',
    }).trim();
    return { approvalToken, approvalSignature };
  } finally {
    fs.unlinkSync(zipPath);
  }
}

async function ensureApproval(task: any) {
  if (!PROTECTED_INTENTS.has(task.intent)) {
    return;
  }

  const secret = process.env.CHANGE_APPROVAL_SECRET;
  if (!secret) {
    throw new Error('missing approval secret');
  }

  const approval = task.approval || {};
  const runId = Number.parseInt(String(approval.runId || ''), 10);
  const providedToken = String(approval.token || '').trim();

  if (!runId || !providedToken) {
    throw new Error('approval metadata missing');
  }

  const { approvalToken, approvalSignature } = await downloadApprovalBundle(runId);
  const artifactToken = approvalToken.trim();
  const artifactSignature = approvalSignature.trim();

  if (
    !artifactToken ||
    !crypto.timingSafeEqual(Buffer.from(artifactToken), Buffer.from(providedToken))
  ) {
    throw new Error('approval token mismatch');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(artifactToken)
    .digest('hex');

  if (
    !artifactSignature ||
    !crypto.timingSafeEqual(Buffer.from(artifactSignature), Buffer.from(expectedSignature))
  ) {
    throw new Error('approval signature mismatch');
  }
}

async function run(task: any) {
  const action = String(task.action || '');
  let ok = true,
    output = '';
  try {
    if (action.startsWith('shell:')) {
      output = execSync(action.slice(6), { stdio: 'pipe', encoding: 'utf-8' });
    } else if (action.startsWith('script:')) {
      const cmd = action.slice(7);
      output = execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' });
    } else if (action.startsWith('workflow:')) {
      const wf = action.slice(9);
      output = execSync(`gh workflow run "${wf}"`, { stdio: 'pipe', encoding: 'utf-8' });
    } else if (action.startsWith('http:')) {
      const [method, url] = action.slice(5).split(':', 2);
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' } });
      output = `HTTP ${res.status}`;
    } else {
      output = 'noop';
    }
  }catch(e:any){ ok=false; output = e?.message||'error'; }
  const row = { id: task.id, ts: Date.now(), intent: task.intent, ok, output };
  fs.appendFileSync(R, JSON.stringify(row)+'\n');
}

(async ()=>{
  const t = pop();
  if (!t) { console.log('no-tasks'); process.exit(0); }
  // Approval guard (simple token check)
  if (['deploy','schema:migrate','rotate:secrets'].includes(t.intent)) {
    if (!process.env.CHANGE_APPROVAL_SECRET) { console.log('missing approval secret'); process.exit(0); }
  }
  await run(t);
  console.log('done', t.id);
})();
  } catch (e: any) {
    ok = false;
    output = e?.message || 'error';
  }
  const row = { id: task.id, ts: Date.now(), intent: task.intent, ok, output };
  fs.appendFileSync(R, JSON.stringify(row) + '\n');
}

(async () => {
  const t = pop();
  if (!t) {
    console.log('no-tasks');
    process.exit(0);
  }
  try {
    await ensureApproval(t);
  } catch (error: any) {
    console.log(error?.message || 'approval failed');
    process.exit(0);
  }
  await run(t);
  console.log('done', t.id);
})().catch((e) => {
  console.error(e);
  process.exit(0);
});
