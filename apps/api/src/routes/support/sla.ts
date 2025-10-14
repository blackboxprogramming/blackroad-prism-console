import { Router } from 'express';
import fs from 'fs';
const r = Router(); const POL='support/sla.json', LOG='data/support/sla_events.jsonl', T='data/support/tickets.jsonl';
const read=()=> fs.existsSync(POL)? JSON.parse(fs.readFileSync(POL,'utf-8')):{ policies:[] };
const write=(o:any)=>{ fs.mkdirSync('support',{recursive:true}); fs.writeFileSync(POL, JSON.stringify(o,null,2)); };
const append=(row:any)=>{ fs.mkdirSync('data/support',{recursive:true}); fs.appendFileSync(LOG, JSON.stringify(row)+'\n'); };
const tickets=()=> fs.existsSync(T)? fs.readFileSync(T,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const tickets=()=> fs.existsSync(T)? fs.readFileSync(T,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/sla/policies/set',(req,res)=>{ write({ policies: req.body?.policies||[] }); res.json({ ok:true }); });
r.post('/sla/evaluate',(req,res)=>{
  const id=String(req.body?.ticketId||''); const t = tickets().find((x:any)=>x.ticketId===id) || {};
  const pol=(read().policies||[]).find((p:any)=>p.priority===t.priority)||{first_response_min:60,resolve_min:1440};
  const ev={ ts:Date.now(), ticketId:id, policy:pol, status:'ok' };
  append(ev); res.json({ ok:true, event: ev });
});
r.get('/sla/recent',(_req,res)=>{ const items=fs.existsSync(LOG)? fs.readFileSync(LOG,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).reverse().slice(0,200):[]; res.json({ items }); });
import yaml from 'yaml';
const r = Router();
const FILE='data/support/tickets.jsonl';
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const write=(rows:any[])=> fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');

function policies(){ return yaml.parse(fs.readFileSync('support/sla_policies.yaml','utf-8')); }

r.post('/sla/apply', (req,res)=>{
  const id = String(req.body?.id||'');
  const rows = read();
  const t = rows.find((x:any)=>x.id===id);
  if (!t) return res.status(404).json({ error:'not_found' });
  const pol = policies();
  const plan = (pol.plans||{})[t.plan||pol.defaults.plan];
  const prio = (pol.priorities||{})[t.priority||pol.defaults.priority];
  const now = Date.now();
  t.sla = {
    first_response_due: now + (prio.first_response_min*60*1000),
    resolve_due: now + (Math.max(prio.resolve_hours, plan.resolve_hours)*60*60*1000)
  };
  write(rows); res.json({ ok:true, sla: t.sla });
});
r.get('/sla/recent',(_req,res)=>{ const items=fs.existsSync(LOG)? fs.readFileSync(LOG,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).reverse().slice(0,200):[]; res.json({ items }); });
export default r;
