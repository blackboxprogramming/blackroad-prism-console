import { Router } from 'express';
import fs from 'fs';
const r = Router(); const POL='lms/policies.json', ACK='data/lms/policy_acks.jsonl', CERT='data/lms/certs.jsonl';
const pread=()=> fs.existsSync(POL)? JSON.parse(fs.readFileSync(POL,'utf-8')):{ policies:{} };
const pwrite=(o:any)=>{ fs.mkdirSync('lms',{recursive:true}); fs.writeFileSync(POL, JSON.stringify(o,null,2)); };
const append=(p:string,row:any)=>{ fs.mkdirSync('data/lms',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/policies/upsert',(req,res)=>{ const o=pread(); const v=req.body||{}; o.policies[v.id]=v; pwrite(o); res.json({ ok:true }); });
r.post('/policies/ack',(req,res)=>{ append(ACK,{ ts:req.body?.ts||Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/policies/status',(req,res)=>{ const sid=String(req.query.subjectId||''); const acks=lines(ACK).filter((x:any)=>x.subjectId===sid).map((x:any)=>x.policyId); res.json({ subjectId:sid, acks }); });

r.post('/certs/issue',(req,res)=>{ append(CERT,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/certs/status',(req,res)=>{ const sid=String(req.query.subjectId||''); const items=lines(CERT).filter((x:any)=>x.subjectId===sid).slice(-50); res.json({ items }); });

export default r;
