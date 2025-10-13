import { Router } from 'express';
import fs from 'fs';
const r = Router(); const O='data/ats/offers.jsonl', B='data/ats/background_checks.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/ats',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/offers/create',(req,res)=>{ append(O,{ ts:Date.now(), state:'draft', esign_provider: process.env.ATS_OFFER_ESIGN_PROVIDER||'stub', ...req.body }); res.json({ ok:true }); });
r.post('/offers/state',(req,res)=>{ append(O,{ ts:Date.now(), offerId:req.body?.offerId, state:req.body?.state }); res.json({ ok:true }); });
r.get('/offers/recent',(req,res)=>{ const app=String(req.query.appId||''); const items=lines(O).reverse().filter((x:any)=>!app||x.appId===app).slice(0,200); res.json({ items }); });

r.post('/background/start',(req,res)=>{ append(B,{ ts:Date.now(), status:'pending', provider:'stub', ...req.body }); res.json({ ok:true }); });
r.post('/background/status',(req,res)=>{ append(B,{ ts:Date.now(), checkId:req.body?.checkId, status:req.body?.status, report_ref:req.body?.report_ref||'' }); res.json({ ok:true }); });
r.get('/background/recent',(req,res)=>{ const app=String(req.query.appId||''); const items=lines(B).reverse().filter((x:any)=>!app||x.appId===app).slice(0,200); res.json({ items }); });

export default r;
