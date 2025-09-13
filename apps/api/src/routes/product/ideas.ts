import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router();
const FILE='data/product/ideas.jsonl';
function append(row:any){ fs.mkdirSync('data/product',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function read(){ if(!fs.existsSync(FILE))return[]; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/ideas/create',(req,res)=>{
  const { title, detail, requester } = req.body||{};
  const row = { id: uuid(), ts: Date.now(), title, detail, requester, status:'open', votes:0, voters:{} as Record<string,number> };
  append(row); res.json({ ok:true, id: row.id });
});

r.post('/ideas/:id/vote',(req,res)=>{
  const id=String(req.params.id); const voter=String(req.body?.voter||'anon'); const weight=Number(req.body?.weight||1);
  const rows=read().map((x:any)=>{ if(x.id!==id) return x; const prev=x.voters?.[voter]||0; const voters={...(x.voters||{}), [voter]:Math.max(prev,weight)}; const votes=Object.values(voters).reduce((a:any,b:any)=>a+Number(b||0),0); return {...x, voters, votes }; });
  fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true });
});

r.get('/ideas/recent',(req,res)=>{
  const status=String(req.query.status||'');
  const items=read().reverse().slice(0,200).filter((x:any)=>!status || x.status===status);
  res.json({ items });
});

r.post('/ideas/:id/status',(req,res)=>{
  const id=String(req.params.id); const status=String(req.body?.status||'open');
  const rows=read().map((x:any)=> x.id===id ? { ...x, status } : x);
  fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true });
});

export default r;
