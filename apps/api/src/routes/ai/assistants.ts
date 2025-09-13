import { Router } from 'express';
import fs from 'fs';
const r = Router(); const FILE='ai/assistants/assistants.json';
const read=()=> fs.existsSync(FILE)? JSON.parse(fs.readFileSync(FILE,'utf-8')):{ list:[] };
const write=(o:any)=> { fs.mkdirSync('ai/assistants',{recursive:true}); fs.writeFileSync(FILE, JSON.stringify(o,null,2)); };

r.post('/assistants/upsert',(req,res)=>{
  const { id, promptKey, tools, packs, safety } = req.body||{};
  const o=read(); const i=o.list.findIndex((a:any)=>a.id===id);
  const row={ id, promptKey, tools:tools||[], packs:packs||[], safety:safety||{mode:process.env.AI_SAFETY_MODE||'standard'} };
  if (i>=0) o.list[i]=row; else o.list.push(row); write(o); res.json({ ok:true });
});

r.get('/assistants/:id',(req,res)=>{
  const id=String(req.params.id); const o=read(); const a=o.list.find((x:any)=>x.id===id); if(!a) return res.status(404).json({error:'not_found'}); res.json(a);
});

export default r;
