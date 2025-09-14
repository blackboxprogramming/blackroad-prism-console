import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/esg/supplier_audits.jsonl';
function append(row:any){ fs.mkdirSync('data/esg',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function read(){ if(!fs.existsSync(FILE))return[]; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }
r.post('/ethics/audit',(req,res)=>{ const { vendorId, standard, score, findings }=req.body||{}; append({ id:uuid(), ts:Date.now(), vendorId, standard, score:Number(score||0), findings:findings||[] }); res.json({ ok:true }); });
r.get('/ethics/recent',(req,res)=>{ const v=String(req.query.vendorId||''); const items=read().reverse().slice(0,200).filter((x:any)=>!v||x.vendorId===v); res.json({ items }); });
export default r;
