import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router();
const FILE='data/mkt/journeys.jsonl';
function append(row:any){ fs.mkdirSync('data/mkt',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function read(){ if(!fs.existsSync(FILE))return[]; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/journeys/create', (req,res)=>{
  const { name, graph } = req.body||{};
  const row = { id: uuid(), name, graph, ts: Date.now(), state:'active' };
  append(row); res.json({ ok:true, id: row.id });
});

r.post('/journeys/trigger', (req,res)=>{
  const { journeyId, subjectId } = req.body||{};
  append({ id: journeyId, event:'trigger', subjectId, ts: Date.now() });
  res.json({ ok:true });
});

export default r;
