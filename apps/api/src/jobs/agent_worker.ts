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
})().catch(e=>{ console.error(e); process.exit(0); });
