import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/p2p/req.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/p2p',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
r.post('/req/create',(req,res)=>{ append({ ts:Date.now(), state:'open', ...req.body }); res.json({ ok:true }); });
export default r;
