import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='data/iam/scim.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/iam',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/scim/provision',(req,res)=>{ append({ ts:Date.now(), ...req.body }); res.json({ ok:true }); });
r.get('/scim/recent',(_req,res)=>{ res.json({ items: read().reverse().slice(0,200) }); });
export default r;
