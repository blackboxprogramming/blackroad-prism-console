import { Router } from 'express';
import fs from 'fs';
const r = Router();
const REG='fa/assets.json', ACQ='data/fa/acquisitions.jsonl', TRN='data/fa/transfers.jsonl', IMP='data/fa/impairments.jsonl', CAP='data/fa/capex.jsonl', CAL='data/fa/capex_alloc.jsonl';
const read=()=> fs.existsSync(REG)? JSON.parse(fs.readFileSync(REG,'utf-8')):{ assets:{} };
const write=(o:any)=>{ fs.mkdirSync('fa',{recursive:true}); fs.writeFileSync(REG, JSON.stringify(o,null,2)); };
const append=(p:string,row:any)=>{ fs.mkdirSync('data/fa',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

r.post('/assets/create',(req,res)=>{
  const o=read(); const a=req.body||{}; o.assets[a.assetId]=a; write(o); append(ACQ,{ ts:Date.now(), ...a }); res.json({ ok:true });
});
r.post('/assets/state',(req,res)=>{
  const o=read(); const a=o.assets[req.body?.assetId]; if(!a) return res.status(404).json({error:'not_found'}); a.state=req.body?.state; write(o); res.json({ ok:true });
});
r.post('/transfer',(req,res)=>{ append(TRN,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/impair',(req,res)=>{ append(IMP,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/capex/approve',(req,res)=>{ append(CAP,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/capex/allocate',(req,res)=>{ append(CAL,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/assets/:assetId',(req,res)=>{ const o=read(); res.json(o.assets[String(req.params.assetId)]||null); });

export default r;
