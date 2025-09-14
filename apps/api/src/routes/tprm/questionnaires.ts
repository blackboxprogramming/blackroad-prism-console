import { Router } from 'express';
import fs from 'fs';
const r = Router(); const Q='data/tprm/qnr.jsonl', E='data/tprm/evidence.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/tprm',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/questionnaires/send',(req,res)=>{ append(Q,{ ts:Date.now(), state:'sent', ...req.body }); res.json({ ok:true }); });
r.post('/questionnaires/submit',(req,res)=>{ append(Q,{ ts:Date.now(), state:'submitted', ...req.body }); (req.body?.attachments||[]).forEach((a:any)=>append(E,{ ts:Date.now(), vendorId:req.body?.vendorId, ref:a })); res.json({ ok:true }); });
r.get('/questionnaires/status',(req,res)=>{ const vid=String(req.query.vendorId||''); const items=read(Q).filter((x:any)=>x.vendorId===vid).slice(-10); res.json({ items }); });
export default r;
