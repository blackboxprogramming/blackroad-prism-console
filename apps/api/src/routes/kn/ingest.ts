import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const DOC='data/knowledge/docs.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/knowledge',{recursive:true}); fs.appendFileSync(DOC, JSON.stringify(row)+'\n'); };
r.post('/ingest',(req,res)=>{
  const { connector, space, docs } = req.body||{};
  (docs||[]).forEach((d:any)=> append({ ts:Date.now(), id:d.docId||uuid(), space: space||process.env.KN_DEFAULT_SPACE||'default', connector, ...d }));
  res.json({ ok:true, ingested: (docs||[]).length });
});
export default r;
