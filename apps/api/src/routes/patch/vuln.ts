import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/patch/vuln.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/patch',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
r.post('/vuln/ingest',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
export default r;
