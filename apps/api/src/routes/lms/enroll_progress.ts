import { Router } from 'express';
import fs from 'fs';
const r = Router(); const EN='data/lms/enrollments.jsonl', PR='data/lms/progress.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/lms',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/enroll',(req,res)=>{ append(EN,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/progress',(req,res)=>{ append(PR,{ ts:req.body?.ts||Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/enrollments',(req,res)=>{ const sid=String(req.query.subjectId||''); res.json({ items: lines(EN).reverse().filter((x:any)=>!sid||x.subjectId===sid).slice(0,200) }); });
export default r;
