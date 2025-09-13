import { Router } from 'express';
import fs from 'fs';
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

r.get('/sla/status/:id', (req,res)=>{
  const t = read().find((x:any)=>x.id===String(req.params.id));
  if (!t?.sla) return res.json({ ok:false });
  const now = Date.now();
  res.json({ ok:true, first_response_overdue: now>t.sla.first_response_due, resolve_overdue: now>t.sla.resolve_due, sla: t.sla });
});

export default r;
