import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router();
const Q = 'data/privacy/dsar_queue.jsonl';

function queue(row:any){ fs.mkdirSync('data/privacy',{recursive:true}); fs.appendFileSync(Q, JSON.stringify(row)+'\n'); }
function find(id:string){
  if (!fs.existsSync(Q)) return null;
  const rows = fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  return rows.find((x:any)=>x.id===id) || null;
}

r.post('/dsar/create', (req,res)=>{
  const { type, subjectId, email, notes } = req.body || {};
  if (!type || !subjectId) return res.status(400).json({ error:'bad_request' });
  const row = { id: uuid(), ts: Date.now(), type, subjectId, email:String(email||''), notes:String(notes||''), status:'queued' };
  queue(row); res.json({ ok:true, id: row.id });
});

r.get('/dsar/:id', (req,res)=> { const item = find(String(req.params.id)); if (!item) return res.status(404).json({ error:'not_found' }); res.json(item); });

r.post('/dsar/:id/complete', (req,res)=>{
  const id = String(req.params.id);
  if (!fs.existsSync(Q)) return res.status(404).json({ error:'not_found' });
  const rows = fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  const out = rows.map((x:any)=> x.id===id ? { ...x, status:'completed', completedAt: Date.now() } : x);
  fs.writeFileSync(Q, out.map(x=>JSON.stringify(x)).join('\n')+'\n');
  res.json({ ok:true });
});

export default r;
