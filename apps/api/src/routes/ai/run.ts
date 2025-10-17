import { Router } from 'express';
import fs from 'fs';
const r = Router();
r.post('/assistants/run',(req,res)=>{
  const id=String(req.body?.id||''); const input=String(req.body?.input||'');
  const aFile='ai/assistants/assistants.json'; const a=fs.existsSync(aFile)?JSON.parse(fs.readFileSync(aFile,'utf-8')):{list:[]};
  const as=a.list.find((x:any)=>x.id===id); if(!as) return res.status(404).json({error:'not_found'});
  res.json({ ok:true, used:{ promptKey: as.promptKey, tools: as.tools, packs: as.packs }, output:`[stub ${process.env.AI_DEFAULT_MODEL}] ${input}` });
});
export default r;
