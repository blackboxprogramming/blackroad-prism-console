import { Router } from 'express';
import fs from 'fs';
const r = Router(); const A='data/ats/analytics.jsonl', APP='data/ats/applications.jsonl', INT='data/ats/interviews.jsonl', OFF='data/ats/offers.jsonl';
const append=(row:any)=>{ fs.mkdirSync('data/ats',{recursive:true}); fs.appendFileSync(A, JSON.stringify(row)+'\n'); };
const lines=(p:string)=> fs.existsSync(p)? fs.readFileSync(p,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
r.get('/analytics/summary',(req,res)=>{
  const period=String(req.query.period||new Date().toISOString().slice(0,7));
  const apps=lines(APP).filter((x:any)=>String(new Date(x.ts).toISOString().slice(0,7))===period).length;
  const ints=lines(INT).filter((x:any)=>String(new Date(x.ts).toISOString().slice(0,7))===period).length;
  const offs=lines(OFF).filter((x:any)=>String(new Date(x.ts).toISOString().slice(0,7))===period && (x.state==='sent'||x.state==='accepted')).length;
  const accp=lines(OFF).filter((x:any)=>String(new Date(x.ts).toISOString().slice(0,7))===period && x.state==='accepted').length;
  const row={ ts:Date.now(), period, apps, interviews:ints, offers:offs, accepts:accp };
  append(row); res.json(row);
});

r.post('/report/generate',(req,res)=>{
  const period=String(req.body?.period||new Date().toISOString().slice(0,7));
  const type=String(req.body?.type||'pipeline');
  const dir='ats/reports'; fs.mkdirSync(dir,{recursive:true});
  const path=`${dir}/${type.toUpperCase()}_${period.replace('-','')}.md`;
  fs.writeFileSync(path, `# ATS ${type.toUpperCase()} ${period}\n\n- Generated stub\n`);
  res.json({ ok:true, file: path });
});
r.get('/report/latest',(_req,res)=>{
  const dir='ats/reports'; if(!fs.existsSync(dir)) return res.json({ latest:null });
  const files=fs.readdirSync(dir).sort().reverse()[0]||null; res.json({ latest: files });
});
export default r;
