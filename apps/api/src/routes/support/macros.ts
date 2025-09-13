import { Router } from 'express';
import yaml from 'yaml';
import fs from 'fs';
const r = Router();
const FILE='data/support/tickets.jsonl';
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const write=(rows:any[])=> fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');

function macros(){ return yaml.parse(fs.readFileSync('support/macros.yaml','utf-8'))?.macros||{}; }

r.post('/macros/run', (req,res)=>{
  const { id, macro } = req.body||{};
  const m = macros()[macro];
  if (!m) return res.status(404).json({ error:'macro_not_found' });
  const rows = read().map((x:any)=> x.id===id ? { ...x, status: m.status || x.status, tags:[...new Set([...(x.tags||[]), ...(m.tags||[])])], lastNote: m.note, updatedAt: Date.now() } : x);
  write(rows); res.json({ ok:true });
});

r.get('/queues/:name', (req,res)=>{
  const name = String(req.params.name);
  const rows = read().reverse().slice(0,200);
  let items = rows;
  if (name==='unassigned') items = rows.filter((x:any)=>!x.assignee);
  if (name==='pending') items = rows.filter((x:any)=>x.status==='pending');
  if (name==='p1') items = rows.filter((x:any)=>(x.priority||'')==='P1');
  res.json({ items });
});

export default r;
