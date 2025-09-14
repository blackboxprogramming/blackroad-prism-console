import { Router } from 'express';
import fs from 'fs';
const r = Router(); const XREF='mdm/xref.json';
const pathFor=(d:string)=>({ golden:`mdm/golden/${d}.json`, pub:`data/mdm/publish_${d}.jsonl` });
const read=(p:string,d:any)=> fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf-8')):d;
const append=(p:string,row:any)=>{ fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true}); fs.appendFileSync(p, JSON.stringify(row)+'\n'); };

r.post('/publish/changes',(req,res)=>{
  const domain=String(req.body?.domain||'accounts'); const p=pathFor(domain);
  const since=Number(req.body?.since||0);
  const g=read(p.golden,{records:{}}).records||{};
  const now=Date.now(); let count=0;
  for(const [id,rec] of Object.entries(g)){
    const evt={ ts: now, op:'upsert', domain, id, record: rec };
    if(now>since){ append(p.pub, evt); count++; }
  }
  res.json({ ok:true, count, mode: process.env.MDM_PUBLISH_MODE||'file' });
});

r.get('/publish/recent',(req,res)=>{
  const domain=String(req.query.domain||'accounts'); const p=pathFor(domain).pub;
  const items = fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).reverse().slice(0,200):[];
  res.json({ items });
});
export default r;
