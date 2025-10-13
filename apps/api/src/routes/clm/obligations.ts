import { Router } from 'express';
import fs from 'fs';
const r = Router();
const FILE='data/clm/obligations.jsonl';
function append(row:any){ fs.mkdirSync('data/clm',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function read(){ if(!fs.existsSync(FILE)) return []; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/obligations/add', (req,res)=>{
  const { contractId, title, due } = req.body||{};
  append({ id:`${contractId}:${title}`, contractId, title, due, status:'open', ts: Date.now() });
  res.json({ ok:true });
});

r.post('/obligations/complete', (req,res)=>{
  const { id } = req.body||{};
  const rows = read().map((x:any)=> x.id===id ? { ...x, status:'done', doneAt: Date.now() } : x);
  fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
  res.json({ ok:true });
});

r.get('/obligations/list', (_req,res)=> res.json({ items: read().slice(-200).reverse() }));

export default r;
