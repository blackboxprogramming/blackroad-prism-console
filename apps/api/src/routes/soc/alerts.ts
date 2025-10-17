import { Router } from 'express';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
const r = Router(); const FILE='data/soc/alerts.jsonl';
function append(row:any){ fs.mkdirSync('data/soc',{recursive:true}); fs.appendFileSync(FILE, JSON.stringify(row)+'\n'); }
function read(){ if(!fs.existsSync(FILE)) return []; return fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

r.post('/alerts/ingest',(req,res)=>{
  const { source, ruleId, event } = req.body||{};
  const id = uuid(); const severity = process.env.SOC_DEFAULT_SEVERITY || 'medium';
  append({ id, ts: Date.now(), status:'open', source, ruleId: ruleId||null, event, severity });
  res.json({ ok:true, id });
});

r.post('/alerts/:id/triage',(req,res)=>{
  const id=String(req.params.id); const { status, analyst, notes } = req.body||{};
  const rows=read().map((x:any)=> x.id===id?{...x,status:status||x.status,analyst,notes:notes||''}:x);
  fs.writeFileSync(FILE, rows.map(x=>JSON.stringify(x)).join('\n')+'\n'); res.json({ ok:true });
});

r.get('/alerts/recent',(req,res)=>{
  const st=String(req.query.status||''); const items=read().reverse().slice(0,200).filter((x:any)=>!st||x.status===st);
  res.json({ items });
});

export default r;
