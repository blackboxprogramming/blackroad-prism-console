import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/privacy/dsar.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/privacy',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const list=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
r.post('/dsar/create',(req,res)=>{ const row={ ts:Date.now(), state:'open', requestId:req.body?.requestId||uuid(), ...req.body }; append(row); res.json({ ok:true, requestId: row.requestId }); });
r.post('/dsar/verify',(req,res)=>{ const rows=list().map((x:any)=>x.requestId===req.body?.requestId?{...x,verify:{method:req.body?.method,status:req.body?.status,ts:Date.now()}}:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true }); });
r.post('/dsar/fulfill',(req,res)=>{ const rows=list().map((x:any)=>x.requestId===req.body?.requestId?{...x,state:'closed',result:req.body?.result,export_path:req.body?.export_path||'',erase_summary:req.body?.erase_summary||'',closedAt:Date.now()}:x); fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true }); });
r.get('/dsar/status/:requestId',(req,res)=>{ const it=list().find((x:any)=>x.requestId===String(req.params.requestId)); if(!it) return res.status(404).json({error:'not_found'}); res.json(it); });
const r = Router();
const Q = 'data/privacy/dsar_queue.jsonl';

type QueueItem = {
  id: string;
  ts: number;
  type: string;
  subjectId: string;
  email: string;
  notes: string;
  status: string;
  completedAt?: number;
};

function ensureDir(){ fs.mkdirSync('data/privacy',{recursive:true}); }
function loadQueue(): QueueItem[]{
  if (!fs.existsSync(Q)) return [];
  const raw = fs.readFileSync(Q,'utf-8').trim();
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map((l)=>JSON.parse(l) as QueueItem);
}
function queue(row:QueueItem){ ensureDir(); fs.appendFileSync(Q, JSON.stringify(row)+'\n'); }
function find(id:string){
  return loadQueue().find((x)=>x.id===id) || null;
}

r.post('/dsar/create', (req,res)=>{
  const { type, subjectId, email, notes } = req.body || {};
  if (!type || !subjectId) return res.status(400).json({ error:'bad_request' });
  const row: QueueItem = { id: uuid(), ts: Date.now(), type, subjectId, email:String(email||''), notes:String(notes||''), status:'queued' };
  queue(row); res.json({ ok:true, id: row.id });
});

r.get('/dsar/last50', (_req,res)=>{
  const items = loadQueue();
  res.json({ items: items.slice(-50).reverse() });
});

r.get('/dsar/:id', (req,res)=> { const item = find(String(req.params.id)); if (!item) return res.status(404).json({ error:'not_found' }); res.json(item); });

r.post('/dsar/:id/complete', (req,res)=>{
  const id = String(req.params.id);
  if (!fs.existsSync(Q)) return res.status(404).json({ error:'not_found' });
  const rows = loadQueue();
  const out = rows.map((x:any)=> x.id===id ? { ...x, status:'completed', completedAt: Date.now() } : x);
  fs.writeFileSync(Q, out.map(x=>JSON.stringify(x)).join('\n')+'\n');
  res.json({ ok:true });
});

export default r;
