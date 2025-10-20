import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router();
function pathFor(domain:string){ return `data/mdm/stage_${domain}.jsonl`; }
const append=(p:string,row:any)=>{ fs.mkdirSync('data/mdm',{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };
const read=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.post('/stage/upsert',(req,res)=>{
  const { domain, source, source_id, record } = req.body||{};
  const row={ ts:Date.now(), _id:uuid(), domain, source, source_id, record };
  append(pathFor(domain), row); res.json({ ok:true, id: row._id });
});
r.get('/stage/recent',(req,res)=>{ const d=String(req.query.domain||'accounts'); const s=String(req.query.source||''); const p=pathFor(d); const items=read(p).reverse().filter((x:any)=>!s||x.source===s).slice(0,200); res.json({ items }); });
export default r;
