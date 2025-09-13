import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';

const r = Router();
const INC = 'data/itsm/incidents.jsonl';
function appendIncident(row:any){ fs.mkdirSync('data/itsm', { recursive:true }); fs.appendFileSync(INC, JSON.stringify(row)+'\n'); }
function readIncidents(){
  if (!fs.existsSync(INC)) return [];
  return fs.readFileSync(INC,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
}

r.post('/incidents/declare', (req,res) => {
  const { sev, summary, service, commander } = req.body || {};
  if (!sev || !summary) return res.status(400).json({ error:'bad_request' });
  const id = uuid();
  const row = { id, ts: Date.now(), sev, summary, service: String(service||'unknown'), commander: String(commander||''), status:'active' };
  appendIncident(row);
  const tl = path.join('data/itsm/timeline', `${id}.jsonl`);
  fs.mkdirSync(path.dirname(tl), { recursive:true });
  fs.appendFileSync(tl, JSON.stringify({ ts: row.ts, who:'system', msg:`Declared ${sev}: ${summary}`})+'\n');
  res.json({ ok:true, id });
});

r.post('/incidents/:id/update', (req,res)=>{
  const { id } = req.params; const { msg } = req.body || {};
  if (!msg) return res.status(400).json({ error:'bad_request' });
  const tl = path.join('data/itsm/timeline', `${id}.jsonl`);
  fs.appendFileSync(tl, JSON.stringify({ ts: Date.now(), who:'update', msg:String(msg) })+'\n');
  res.json({ ok:true });
});

r.post('/incidents/:id/resolve', (req,res)=>{
  const { id } = req.params; const { outcome } = req.body || {};
  const rows = readIncidents();
  const out = rows.map((x:any)=> x.id===id ? { ...x, status:'resolved', resolvedAt: Date.now(), outcome: String(outcome||'resolved') } : x);
  fs.writeFileSync(INC, out.map(x=>JSON.stringify(x)).join('\n')+'\n');
  const tl = path.join('data/itsm/timeline', `${id}.jsonl`);
  fs.appendFileSync(tl, JSON.stringify({ ts: Date.now(), who:'system', msg:`Resolved: ${outcome||'resolved'}` })+'\n');
  res.json({ ok:true });
});

r.get('/incidents/:id/timeline', (req,res)=>{
  const f = path.join('data/itsm/timeline', `${String(req.params.id)}.jsonl`);
  if (!fs.existsSync(f)) return res.json({ events: [] });
  const events = fs.readFileSync(f,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  res.json({ events });
});

r.get('/incidents/recent', (_req,res)=>{
  const items = readIncidents().slice(-50).reverse();
  res.json({ items });
});

export default r;
