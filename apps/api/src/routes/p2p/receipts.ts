import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/p2p/receipts.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/p2p',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
r.post('/receipt/log',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
export default r;
