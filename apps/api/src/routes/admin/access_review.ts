import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

const r = Router();

function reviewsDir(){ const p = 'data/admin/access_reviews'; fs.mkdirSync(p,{recursive:true}); return p; }
function writeLine(id:string, row:any){ fs.appendFileSync(path.join(reviewsDir(), `${id}.jsonl`), JSON.stringify(row)+'\n'); }

r.post('/access-review/start', (req, res) => {
  const id = uuid();
  const quarter = String(req.body?.quarter || '');
  writeLine(id, { ts: Date.now(), type:'start', quarter });
  res.json({ ok:true, id });
});

r.get('/access-review/:id', (req,res) => {
  const f = path.join(reviewsDir(), `${String(req.params.id)}.jsonl`);
  if (!fs.existsSync(f)) return res.status(404).json({ error:'not_found' });
  const events = fs.readFileSync(f,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  res.json({ events });
});

r.post('/access-review/:id/attest', (req,res) => {
  const { managerId, userId, system, role, decision, notes } = req.body || {};
  if (!managerId || !userId || !system || !role || !decision) return res.status(400).json({ error:'bad_request' });
  writeLine(String(req.params.id), { ts: Date.now(), type:'attest', managerId, userId, system, role, decision, notes:String(notes||'') });
  res.json({ ok:true });
});

export default r;
