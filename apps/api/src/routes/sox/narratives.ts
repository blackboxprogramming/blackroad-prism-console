import { Router } from 'express';
import fs from 'fs';
const r = Router();
r.post('/narrative/upsert',(req,res)=>{
  const { processId, title, md } = req.body||{};
  const path=`sox/narratives/${processId}.md`;
  fs.mkdirSync('sox/narratives',{recursive:true});
  fs.writeFileSync(path, `# ${title}\n\n${md||''}\n`);
  res.json({ ok:true, file: path });
});
r.get('/narrative/:processId',(req,res)=>{
  const p=`sox/narratives/${String(req.params.processId)}.md`;
  if(!fs.existsSync(p)) return res.status(404).json({error:'not_found'});
  res.type('text/markdown').send(fs.readFileSync(p,'utf-8'));
});
export default r;
