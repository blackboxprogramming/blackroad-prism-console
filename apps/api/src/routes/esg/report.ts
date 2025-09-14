import { Router } from 'express';
import fs from 'fs';
const r = Router(); const E='data/esg/emissions.jsonl', AUD='data/esg/audit.jsonl';
const appendAudit=(row:any)=>{ fs.mkdirSync('data/esg',{recursive:true}); fs.appendFileSync(AUD, JSON.stringify(row)+'\n'); };
r.post('/report/generate',(req,res)=>{
  const year=String(req.body?.year||new Date().getFullYear());
  const em=fs.existsSync(E)? fs.readFileSync(E,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((x:any)=>String(x.period||'').startsWith(year)) : [];
  const total=em.reduce((s:any,x:any)=>s+Number(x.total||0),0);
  fs.mkdirSync('esg/reports',{recursive:true});
  const file=`esg/reports/ESG_${year}.md`;
  fs.writeFileSync(file, `# ESG Report ${year}\n\n- Records: ${em.length}\n- Total tCO2e: ${total}\n`);
  appendAudit({ ts:Date.now(), year, file, standard:req.body?.standard||'GHG' });
  res.json({ ok:true, file });
});
r.get('/report/latest',(_req,res)=>{
  const dir='esg/reports'; if(!fs.existsSync(dir)) return res.json({ latest:null });
  const files=fs.readdirSync(dir).filter(f=>f.startsWith('ESG_')).sort().reverse(); res.json({ latest: files[0]||null });
});
export default r;
