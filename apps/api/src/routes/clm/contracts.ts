import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

const r = Router();
const FILE='data/clm/contracts.jsonl';
function append(row:any){ fs.mkdirSync('data/clm',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function read(){ if(!fs.existsSync(FILE)) return []; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/contracts/create', (req,res)=>{
  const { title, type, party, amount, renewalDate, vendorName, poNumber } = req.body || {};
  const id = uuid();
  const row = { id, ts: Date.now(), title, type, party, amount:Number(amount||0), state:'Draft', renewalDate: renewalDate||'', vendorName: vendorName||'', poNumber: poNumber||'' };
  append(row); res.json({ ok:true, id });
});

r.post('/contracts/redline/upload', (req,res)=>{
  const { id, version, path } = req.body || {};
  if (!id || !version || !path) return res.status(400).json({ error:'bad_request' });
  fs.mkdirSync('data/clm/redlines',{recursive:true});
  fs.writeFileSync(`data/clm/redlines/${id}_${version}.txt`, `PATH=${path}\n`);
  append({ id, ts: Date.now(), event:'redline', version, file:`data/clm/redlines/${id}_${version}.txt` });
  res.json({ ok:true });
});

r.post('/contracts/state', (req,res)=>{
  const { id, state } = req.body || {};
  const rows = read().map((x:any)=> x.id===id ? { ...x, state } : x);
  fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
  res.json({ ok:true });
});

r.get('/contracts/list', (_req,res)=>{ res.json({ items: read().slice(-200).reverse() }); });

export default r;
