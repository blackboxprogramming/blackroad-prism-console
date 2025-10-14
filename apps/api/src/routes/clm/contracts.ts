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

const r = Router(); const C='data/clm/contracts.jsonl', A='data/clm/attachments.jsonl', R='data/clm/redlines.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/clm',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const list=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/contracts/create',(req,res)=>{ const id=req.body?.contractId||uuid(); append(C,{ ts:Date.now(), contractId:id, ...req.body, state:'drafting' }); res.json({ ok:true, contractId:id }); });
r.post('/contracts/attach',(req,res)=>{ append(A,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/contracts/redline',(req,res)=>{ append(R,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/contracts/:contractId',(req,res)=>{ const c=list(C).find((x:any)=>x.contractId===String(req.params.contractId))||null; const red=list(R).filter((x:any)=>x.contractId===String(req.params.contractId)); const att=list(A).filter((x:any)=>x.contractId===String(req.params.contractId)); res.json({ contract:c, redlines:red, attachments:att }); });
export default r;
