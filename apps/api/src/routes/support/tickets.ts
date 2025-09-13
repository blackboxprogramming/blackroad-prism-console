import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

const r = Router();
const FILE = 'data/support/tickets.jsonl';
function append(row:any){ fs.mkdirSync('data/support',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function read(){ if(!fs.existsSync(FILE))return[]; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/tickets/create', (req,res)=>{
  const { subject, body, requester, channel } = req.body || {};
  const t = { id: uuid(), ts: Date.now(), subject, body, requester, channel: String(channel||'web'), status:'open', assignee:'', tags:[] };
  append(t); res.json({ ok:true, id: t.id });
});

r.post('/tickets/:id/update', (req,res)=>{
  const id = String(req.params.id);
  const rows = read().map((x:any)=> x.id===id ? { ...x, ...req.body, updatedAt: Date.now() } : x);
  fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
  res.json({ ok:true });
});

r.get('/tickets/recent', (req,res)=>{
  const status = String(req.query.status||'');
  const items = read().reverse().slice(0,200).filter((x:any)=>!status||x.status===status);
  res.json({ items });
});

export default r;
