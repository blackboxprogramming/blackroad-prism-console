import { Router } from 'express';
import fs from 'fs';
const r = Router(); const DOC='data/knowledge/docs.jsonl', IDX='knowledge/index.json';
const docs=()=> fs.existsSync(DOC)? fs.readFileSync(DOC,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
const read=()=> fs.existsSync(IDX)? JSON.parse(fs.readFileSync(IDX,'utf-8')):{ spaces:{} };
const write=(o:any)=>{ fs.mkdirSync('knowledge',{recursive:true}); fs.writeFileSync(IDX, JSON.stringify(o,null,2)); };
r.post('/index/build',(req,res)=>{
  const space=String(req.body?.space||process.env.KN_DEFAULT_SPACE||'default');
  const list=docs().filter((d:any)=>d.space===space).map((d:any)=>({id:d.id,title:d.title,labels:d.labels||{},source:d.source||'',path:d.path||''}));
  const o=read(); o.spaces[space]={ builtAt: Date.now(), count: list.length, docs: list }; write(o);
  res.json({ ok:true, space, count: list.length });
});
r.get('/index/:space',(req,res)=>{ const o=read().spaces[String(req.params.space)]||{docs:[]}; res.json(o); });
export default r;
