import { Router } from 'express';
import fs from 'fs';
import yaml from 'yaml';

const r = Router();
const RULES = `type_rules:
  MSA: [legal, exec]
  NDA: [legal]
  SOW: [legal, finance]
  DPA: [legal, security]`;

function approvalsFor(type:string){
  const rules = yaml.parse(RULES) || {}; return (rules.type_rules||{})[type] || ['legal'];
}
const FILE='data/clm/contracts.jsonl';
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const write=(rows:any[])=> fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');

r.post('/approvals/route', (req,res)=>{
  const { id } = req.body||{};
  const rows = read();
  const c = rows.find((x:any)=>x.id===id);
  if (!c) return res.status(404).json({ error:'not_found' });
  c.approvals = approvalsFor(c.type);
  write(rows); res.json({ ok:true, approvals: c.approvals });
});

r.post('/approvals/attest', (req,res)=>{
  const { id, approver, decision } = req.body||{};
  const rows = read();
  const c = rows.find((x:any)=>x.id===id);
  if (!c) return res.status(404).json({ error:'not_found' });
  c.approvals_done = [...(c.approvals_done||[]), { approver, decision, ts: Date.now() }];
  write(rows); res.json({ ok:true, approvals_done: c.approvals_done });
});

export default r;
