import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/clm/esign.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/clm',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/esign/send',(req,res)=>{ append({ ts:Date.now(), provider: process.env.CLM_ESIGN_PROVIDER||'stub', ...req.body, status:'sent' }); res.json({ ok:true }); });
r.post('/esign/callback',(req,res)=>{ append({ ts:Date.now(), event:'callback', provider:req.body?.provider, payload:req.body?.payload||{} }); res.json({ ok:true }); });
r.get('/esign/status/:contractId',(req,res)=>{ const it=read().reverse().find((x:any)=>x.contractId===String(req.params.contractId))||null; res.json({ status: it?.status||'unknown', last: it }); });
export default r;
