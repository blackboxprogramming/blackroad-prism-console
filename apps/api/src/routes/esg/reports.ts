import { Router } from 'express';
import fs from 'fs';
const r = Router(); const TRAIL='data/esg/audit_trail.jsonl';
function appendTrail(row:any){ fs.mkdirSync('data/esg',{recursive:true}); fs.appendFileSync(TRAIL, JSON.stringify(row)+'\n'); }
r.post('/report/publish',(req,res)=>{
  const { standard, period } = req.body||{};
  const path=`data/esg/reports/ESG_${period||'unknown'}.md`;
  const md=`# ESG Report ${period}\n\n- Standard: ${standard}\n- Generated: ${new Date().toISOString()}\n`;
  fs.mkdirSync('data/esg/reports',{recursive:true}); fs.writeFileSync(path, md);
  appendTrail({ ts:Date.now(), action:'publish', standard, period, file:path });
  res.json({ ok:true, file: path });
});
r.get('/reports/latest',(_req,res)=>{
  const dir='data/esg/reports'; if(!fs.existsSync(dir)) return res.json({ latest: null });
  const files=fs.readdirSync(dir).filter(f=>f.endsWith('.md')).sort().reverse(); res.json({ latest: files[0]||null });
});
export default r;
