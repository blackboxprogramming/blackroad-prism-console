import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import CryptoJS from 'crypto-js';
const r = Router(); const T='data/sox/tests.jsonl', E='data/sox/evidence.jsonl', S='data/sox/signoff.jsonl';
const append=(f:string,row:any)=>{ fs.mkdirSync('data/sox',{recursive:true}); fs.appendFileSync(f, JSON.stringify(row)+'\n'); };

r.post('/tests/create',(req,res)=>{
  const id=uuid(); append(T,{ id, ts:Date.now(), ...req.body, status:'open' }); res.json({ ok:true, testId:id });
});
r.post('/tests/result',(req,res)=>{
  const rows=fs.existsSync(T)?fs.readFileSync(T,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
  const i=rows.findIndex((x:any)=>x.id===req.body?.testId);
  if(i<0) return res.status(404).json({error:'not_found'}); rows[i]={ ...rows[i], result:req.body?.result, exceptions:req.body?.exceptions||[], closedAt:Date.now(), status:'closed' }; fs.writeFileSync(T, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true });
});
r.post('/evidence/attach',(req,res)=>{
  const { testId, ref, sha256, note } = req.body||{};
  const mode=process.env.SOX_EVIDENCE_HASH_MODE||'sha256';
  const hash = sha256 || CryptoJS.SHA256(ref||'').toString();
  append(E,{ ts:Date.now(), testId, ref, hash, note, mode }); res.json({ ok:true });
});
r.post('/signoff',(req,res)=>{
  const { testId, approver, role } = req.body||{};
  append(S,{ ts:Date.now(), testId, approver, role }); res.json({ ok:true });
});
r.get('/tests/recent',(req,res)=>{
  const cid=String(req.query.controlId||''); const per=String(req.query.period||'');
  const rows=fs.existsSync(T)?fs.readFileSync(T,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
  const items=rows.reverse().filter((x:any)=>(!cid||x.controlId===cid)&&(!per||x.period===per)).slice(0,200);
  res.json({ items });
});
export default r;
