import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FEED='data/expenses/card_feeds.jsonl', AL='data/expenses/card_alloc.jsonl';
const append=(p:string,row:any)=>{ fs.mkdirSync('data/expenses',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
r.post('/cards/ingest',(req,res)=>{ append(FEED,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.post('/cards/allocate',(req,res)=>{ append(AL,{ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/cards/recent',(req,res)=>{ const feedId=String(req.query.feedId||''); const items=read(FEED).reverse().filter((x:any)=>!feedId||x.feedId===feedId).slice(0,200); res.json({ items }); });
export default r;
