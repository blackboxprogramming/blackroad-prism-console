import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/p2p/ap_exports.jsonl';
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
r.post('/payments/export',(req,res)=>{ fs.mkdirSync('data/p2p',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify({ ts:Date.now(), ...req.body })+'\\n'); res.json({ ok:true }); });
r.get('/payments/recent',(_req,res)=>{ res.json({ items: read().reverse().slice(0,200) }); });
export default r;
