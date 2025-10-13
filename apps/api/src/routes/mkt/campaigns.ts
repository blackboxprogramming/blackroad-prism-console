import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router();
const FILE='data/mkt/campaigns.jsonl';
function append(row:any){ fs.mkdirSync('data/mkt',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function read(){ if(!fs.existsSync(FILE)) return []; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/campaigns/create', (req,res)=>{
  const { name, channel, segmentKey, template, scheduleAt } = req.body||{};
  const row = { id: uuid(), ts: Date.now(), name, channel, segmentKey, template, scheduleAt, state:'draft', sent:0 };
  append(row); res.json({ ok:true, id: row.id });
});

r.post('/campaigns/state', (req,res)=>{
  const { id, state } = req.body||{};
  const rows = read().map((c:any)=> c.id===id ? { ...c, state } : c);
  fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
  res.json({ ok:true });
});

export default r;
