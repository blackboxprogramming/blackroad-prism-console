import { Router } from 'express';
import fs from 'fs';
const r = Router(); const I='data/ats/interviews.jsonl', F='data/ats/feedback.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/ats',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/interviews/schedule',(req,res)=>{ append(I,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/feedback/submit',(req,res)=>{ append(F,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/interviews/recent',(req,res)=>{ const app=String(req.query.appId||''); const items=lines(I).reverse().filter((x:any)=>!app||x.appId===app).slice(0,200); res.json({ items }); });
export default r;
