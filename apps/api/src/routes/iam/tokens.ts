import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/iam/tokens.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/iam',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); };
const read=()=> fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
r.post('/tokens/mint',(req,res)=>{
  const { subject, audience, scope, ttl_s } = req.body||{};
  const ttl=Number(ttl_s||process.env.IAM_TOKEN_TTL_DEFAULT_S||3600);
  const token=`tok_${uuid()}`;
  const row={ ts:Date.now(), token, subject, audience, scope, exp: Date.now()+ttl*1000 };
  append(row);
  res.json({ ok:true, token, exp: row.exp });
});
r.get('/tokens/recent',(_req,res)=>{ res.json({ items: read().reverse().slice(0,200) }); });
export default r;
